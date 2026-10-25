import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { planCloudinaryDeletions } from "@/lib/cloudinary-media";
import { catalogCategories, ContentKey, ContentSnapshot, defaults, productsWithCategoryNames, resolveContent, type StoreCategory, type StoreProduct } from "@/lib/content";
import { prepareProductsForSave } from "@/lib/products";
import { referencedProductIds } from "@/lib/image-source";
import { contentSchemas } from "@/lib/content-schema";
import { cloudinaryPublicId, deleteCloudinaryImage } from "@/server/cloudinary";
import { prisma } from "@/server/prisma";

const CLEANUP_QUEUE_KEY = "__cloudinary_cleanup";
const IMAGE_REFERENCE_KEYS: ContentKey[] = ["hero", "categories", "texts", "instagram"];

export const contentKeys = Object.keys(defaults) as ContentKey[];

export class ContentValidationError extends Error {}

export async function loadContentSnapshot(): Promise<ContentSnapshot> {
  const rows = await prisma.siteContent.findMany({ where: { key: { in: contentKeys } } }).catch(() => []);
  const saved = new Map(rows.map((row) => [row.key, row.data]));
  const snapshot = Object.fromEntries(contentKeys.map((key) => {
    const parsed = contentSchemas[key].safeParse(saved.get(key));
    return [key, resolveContent(key, parsed.success ? parsed.data : undefined)];
  })) as ContentSnapshot;
  const parsedCategories = contentSchemas.categories.safeParse(saved.get("categories"));
  snapshot.categories = catalogCategories(parsedCategories.success ? parsedCategories.data as StoreCategory[] : null, snapshot.texts, snapshot.products);
  snapshot.products = productsWithCategoryNames(snapshot.products, snapshot.categories);
  return snapshot;
}

function imageUrls(value: unknown): string[] {
  if (typeof value === "string") return cloudinaryPublicId(value) ? [value] : [];
  if (Array.isArray(value)) return value.flatMap(imageUrls);
  if (value && typeof value === "object") return Object.values(value).flatMap(imageUrls);
  return [];
}

function queuedUrls(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((url): url is string => typeof url === "string" && cloudinaryPublicId(url) !== null))];
}

async function persistCleanupQueue(urls: string[]) {
  if (urls.length) {
    await prisma.siteContent.upsert({
      where: { key: CLEANUP_QUEUE_KEY },
      create: { key: CLEANUP_QUEUE_KEY, data: urls },
      update: { data: urls },
    });
  } else {
    await prisma.siteContent.deleteMany({ where: { key: CLEANUP_QUEUE_KEY } });
  }
}

export async function saveContentAndCleanImages(key: ContentKey, value: unknown, uploadedUrls: string[] = []) {
  const saved = await prisma.$transaction(async (transaction) => {
    const [previous, queue, textsRow, productsRow, categoriesRow] = await Promise.all([
      transaction.siteContent.findUnique({ where: { key }, select: { data: true } }),
      transaction.siteContent.findUnique({ where: { key: CLEANUP_QUEUE_KEY }, select: { data: true } }),
      transaction.siteContent.findUnique({ where: { key: "texts" }, select: { data: true } }),
      transaction.siteContent.findUnique({ where: { key: "products" }, select: { data: true } }),
      transaction.siteContent.findUnique({ where: { key: "categories" }, select: { data: true } }),
    ]);
    const currentProducts = resolveContent("products", productsRow?.data ?? defaults.products);
    const currentTexts = resolveContent("texts", textsRow?.data);
    const parsedCategories = contentSchemas.categories.safeParse(categoriesRow?.data);
    const availableCategories = catalogCategories(parsedCategories.success ? parsedCategories.data as StoreCategory[] : null, currentTexts, currentProducts);
    let merged = resolveContent(key, value);
    if (key === "categories") {
      const nextCategories = merged as ContentSnapshot["categories"];
      const ids = nextCategories.map((category) => category.id);
      const names = nextCategories.map((category) => category.name.trim().toLocaleLowerCase("es-AR"));
      if (new Set(ids).size !== ids.length || new Set(names).size !== names.length) {
        throw new ContentValidationError("Cada categoría debe tener un nombre y un identificador únicos.");
      }
      if (currentProducts.some((product) => !ids.includes(product.categoryId ?? ""))) {
        throw new ContentValidationError("No podés borrar una categoría que tiene productos. Reasignalos primero.");
      }
    }
    if (key === "products") {
      const nextProducts = merged as StoreProduct[];
      if (new Set(nextProducts.map((product) => product.id)).size !== nextProducts.length) {
        throw new ContentValidationError("Hay productos con identificadores repetidos.");
      }
      const categories = new Map(availableCategories.map((category) => [category.id, category.name]));
      if (nextProducts.some((product) => !categories.has(product.categoryId ?? ""))) {
        throw new ContentValidationError("Asigná a cada producto una categoría creada en el administrador.");
      }
      const imageSections = await transaction.siteContent.findMany({ where: { key: { in: IMAGE_REFERENCE_KEYS } }, select: { data: true } });
      const remainingIds = new Set(nextProducts.map((product) => product.id));
      if (imageSections.some((section) => referencedProductIds(section.data).some((id) => !remainingIds.has(id)))) {
        throw new ContentValidationError("Hay productos usados como foto en otras secciones. Quitá esas referencias antes de borrar el producto.");
      }
      merged = prepareProductsForSave(nextProducts.map((product) => ({
        ...product,
        category: categories.get(product.categoryId ?? "") ?? product.category,
      })), currentProducts, Date.now());
    }
    if (IMAGE_REFERENCE_KEYS.includes(key)) {
      const availableIds = new Set(currentProducts.map((product) => product.id));
      if (referencedProductIds(merged).some((id) => !availableIds.has(id))) {
        throw new ContentValidationError("La foto seleccionada pertenece a un producto que ya no existe.");
      }
    }
    const row = await transaction.siteContent.upsert({
      where: { key },
      create: { key, data: merged as Prisma.InputJsonValue },
      update: { data: merged as Prisma.InputJsonValue },
    });
    const rows = await transaction.siteContent.findMany({ select: { key: true, data: true } });
    const referenced = new Set(rows.filter((item) => item.key !== CLEANUP_QUEUE_KEY).flatMap((item) => imageUrls(item.data)));
    const candidates = new Set([...queuedUrls(queue?.data), ...imageUrls(previous?.data), ...uploadedUrls.filter((url) => cloudinaryPublicId(url))]);
    const cleanup = [...candidates].filter((url) => !referenced.has(url));
    if (cleanup.length) {
      await transaction.siteContent.upsert({
        where: { key: CLEANUP_QUEUE_KEY },
        create: { key: CLEANUP_QUEUE_KEY, data: cleanup },
        update: { data: cleanup },
      });
    } else if (queue) {
      await transaction.siteContent.delete({ where: { key: CLEANUP_QUEUE_KEY } });
    }
    return row.data;
  });

  const cleanupPending = await drainCloudinaryCleanupQueue().catch(() => 1);
  return { data: saved, cleanupPending };
}

export async function deleteUnreferencedImages(urls: string[]) {
  const rows = await prisma.siteContent.findMany({ select: { key: true, data: true } });
  const referenced = new Set(rows.filter((row) => row.key !== CLEANUP_QUEUE_KEY).flatMap((row) => imageUrls(row.data)));
  const candidates = planCloudinaryDeletions(urls, referenced, process.env.CLOUDINARY_PROJECT_FOLDER ?? "eterea");
  const results = await Promise.allSettled(candidates.map(deleteCloudinaryImage));
  const failedUrls = candidates.filter((_, index) => results[index]?.status === "rejected");
  const currentQueue = queuedUrls(rows.find((row) => row.key === CLEANUP_QUEUE_KEY)?.data);
  await persistCleanupQueue([...new Set([...currentQueue, ...failedUrls])]);
  const cleanupPending = await drainCloudinaryCleanupQueue();
  return { deleted: results.filter((result) => result.status === "fulfilled").length, failed: cleanupPending };
}

export async function drainCloudinaryCleanupQueue() {
  const rows = await prisma.siteContent.findMany({ select: { key: true, data: true } });
  const queue = queuedUrls(rows.find((row) => row.key === CLEANUP_QUEUE_KEY)?.data);
  const referenced = new Set(rows.filter((row) => row.key !== CLEANUP_QUEUE_KEY).flatMap((row) => imageUrls(row.data)));
  const candidates = queue.filter((url) => !referenced.has(url));
  const deleted = new Set<string>();
  for (const url of candidates) {
    try {
      await deleteCloudinaryImage(url);
      deleted.add(url);
    } catch {
      // Se conserva la URL en la cola para reintentar en el próximo guardado.
    }
  }

  const remainingRows = await prisma.siteContent.findMany({ select: { key: true, data: true } });
  const remainingQueue = queuedUrls(remainingRows.find((row) => row.key === CLEANUP_QUEUE_KEY)?.data);
  const remainingReferences = new Set(remainingRows.filter((row) => row.key !== CLEANUP_QUEUE_KEY).flatMap((row) => imageUrls(row.data)));
  const nextQueue = remainingQueue.filter((url) => !deleted.has(url) && !remainingReferences.has(url));
  await persistCleanupQueue(nextQueue);
  return nextQueue.length;
}
