import type { Prisma } from "@/generated/prisma/client";
import { parseCloudinaryAssetUrl } from "@/lib/cloudinary-media";

type Db = Prisma.TransactionClient;

export async function queueChangedImages(db: Db, urls: string[]) {
  const candidates = [...new Set(urls)].filter((url) => parseCloudinaryAssetUrl(url, "eterea") !== null);
  if (!candidates.length) return 0;

  const [products, productImages, slides, posts, split, editorial, cards, queued] = await Promise.all([
    db.product.findMany({ where: { image: { in: candidates } }, select: { image: true } }),
    db.productImage.findMany({ where: { url: { in: candidates } }, select: { url: true } }),
    db.heroSlide.findMany({ where: { img: { in: candidates } }, select: { img: true } }),
    db.curatedInstagramPost.findMany({ where: { image: { in: candidates } }, select: { image: true } }),
    db.splitBanner.findMany({ where: { img: { in: candidates } }, select: { img: true } }),
    db.editorialBanner.findMany({ where: { img: { in: candidates } }, select: { img: true } }),
    db.homeCategoryCard.findMany({ where: { img: { in: candidates } }, select: { img: true } }),
    db.cloudinaryCleanup.findMany({ where: { url: { in: candidates } }, select: { url: true } }),
  ]);
  const referenced = new Set([
    ...products.map((row) => row.image), ...productImages.map((row) => row.url),
    ...slides.map((row) => row.img), ...posts.map((row) => row.image),
    ...split.map((row) => row.img), ...editorial.map((row) => row.img),
    ...cards.map((row) => row.img),
  ]);
  const obsolete = candidates.filter((url) => referenced.has(url));
  const toQueue = candidates.filter((url) => !referenced.has(url) && !queued.some((item) => item.url === url));
  if (obsolete.length) await db.cloudinaryCleanup.deleteMany({ where: { url: { in: obsolete } } });
  if (toQueue.length) await db.cloudinaryCleanup.createMany({ data: toQueue.map((url) => ({ url })), skipDuplicates: true });
  await db.cloudinaryPendingUpload.deleteMany({ where: { url: { in: candidates } } });
  return queued.filter((item) => !referenced.has(item.url)).length + toQueue.length;
}
