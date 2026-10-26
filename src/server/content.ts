import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { planCloudinaryDeletions } from "@/lib/cloudinary-media";
import { catalogCategories, defaults, productsWithCategoryNames, resolveContent, type ContentKey, type ContentSnapshot, type HomeCategoryCard, type StoreProduct, type TextSectionKey } from "@/lib/content";
import { contentSchemas, textSectionSchemas } from "@/lib/content-schema";
import { referencedProductIds } from "@/lib/image-source";
import { prepareProductsForSave } from "@/lib/products";
import { instagramPermalink } from "@/lib/storefront-rules";
import { loadRelationalCatalog, saveCategoryRows, saveProductRows } from "@/server/catalog";
import { cloudinaryPublicId, deleteCloudinaryImage, deleteCloudinaryPublicId } from "@/server/cloudinary";
import { saveHomeCategoryCardRows } from "@/server/home-category-cards";
import { prisma } from "@/server/prisma";
import { loadRelationalContent, saveRelationalContent, saveRelationalTextSection } from "@/server/relational-content";

type Db = Prisma.TransactionClient;
const PENDING_UPLOAD_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const contentKeys = Object.keys(defaults) as ContentKey[];
export class ContentValidationError extends Error { }

async function readSnapshot(db: Db): Promise<ContentSnapshot> {
  const [saved, catalog, sectionRows] = await Promise.all([
    loadRelationalContent(db), loadRelationalCatalog(db),
    db.contentSection.findMany({ where: { key: { in: ["categories", "products", "homeCategoryCards"] } }, select: { key: true } }),
  ]);
  const sections = new Set(sectionRows.map((row) => row.key));
  const products = sections.has("products") ? resolveContent("products", catalog.products) : resolveContent("products", undefined);
  const categories = sections.has("categories") ? resolveContent("categories", catalog.categories)
    : catalogCategories(null, saved.texts, products);
  const snapshot: ContentSnapshot = {
    ...saved, categories, products: productsWithCategoryNames(products, categories),
    texts: resolveContent("texts", {
      ...saved.texts,
      homeCategoryCards: sections.has("homeCategoryCards") ? catalog.homeCategoryCards : defaults.texts.homeCategoryCards,
    }),
  };
  for (const key of contentKeys) {
    if (!contentSchemas[key].safeParse(snapshot[key]).success) {
      throw new ContentValidationError(`El contenido guardado de ${key} no tiene un formato válido.`);
    }
  }
  return snapshot;
}

export async function loadContentSnapshot({ strict = false }: { strict?: boolean } = {}): Promise<ContentSnapshot> {
  if (strict) return readSnapshot(prisma);
  return readSnapshot(prisma).catch(() => ({
    promo: resolveContent("promo", undefined), hero: resolveContent("hero", undefined),
    products: resolveContent("products", undefined), categories: resolveContent("categories", undefined),
    instagram: resolveContent("instagram", undefined), contact: resolveContent("contact", undefined),
    texts: resolveContent("texts", undefined),
  }));
}

function contentImageUrls(key: ContentKey, value: ContentSnapshot[ContentKey]): string[] {
  if (key === "hero") return (value as ContentSnapshot["hero"]).map((slide) => slide.img);
  if (key === "instagram") return (value as ContentSnapshot["instagram"]).map((post) => post.image);
  if (key === "products") return (value as StoreProduct[]).flatMap((product) => [product.image, ...(product.images ?? [])]);
  if (key === "texts") {
    const texts = value as ContentSnapshot["texts"];
    return [texts.split.img, texts.editorial.img, ...texts.homeCategoryCards.map((card) => card.img)];
  }
  return [];
}

function referencedUrls(snapshot: ContentSnapshot) {
  return new Set([
    ...contentImageUrls("hero", snapshot.hero), ...contentImageUrls("instagram", snapshot.instagram),
    ...contentImageUrls("products", snapshot.products), ...contentImageUrls("texts", snapshot.texts),
  ]);
}

async function queueUnusedImages(db: Db, candidates: string[], snapshot: ContentSnapshot) {
  const referenced = referencedUrls(snapshot);
  const staleUploads = await db.cloudinaryPendingUpload.findMany({
    where: { url: { not: null }, createdAt: { lt: new Date(Date.now() - PENDING_UPLOAD_TTL_MS) } },
    select: { url: true }, orderBy: { createdAt: "asc" }, take: 100,
  });
  const staleUrls = staleUploads.flatMap((item) => item.url ? [item.url] : []);
  const newlyUnused = [...new Set([...candidates, ...staleUrls])]
    .filter((url) => cloudinaryPublicId(url) !== null && !referenced.has(url));
  const queued = await db.cloudinaryCleanup.findMany({ select: { url: true } });
  const unused = [...new Set([...queued.map((item) => item.url), ...newlyUnused])]
    .filter((url) => cloudinaryPublicId(url) !== null && !referenced.has(url));
  await db.cloudinaryCleanup.deleteMany({ where: { url: { notIn: unused } } });
  if (unused.length) await db.cloudinaryCleanup.createMany({ data: unused.map((url) => ({ url })), skipDuplicates: true });
  const settledUploads = [...new Set([...candidates, ...staleUrls])];
  if (settledUploads.length) await db.cloudinaryPendingUpload.deleteMany({ where: { url: { in: settledUploads } } });
  return unused.length;
}

export async function reservePendingUpload(publicId: string) {
  await prisma.cloudinaryPendingUpload.create({ data: { publicId } });
}

export async function completePendingUpload(publicId: string, url: string) {
  await prisma.cloudinaryPendingUpload.update({ where: { publicId }, data: { url } });
}

export async function releasePendingUpload(publicId: string) {
  await prisma.cloudinaryPendingUpload.deleteMany({ where: { publicId } });
}

export async function sweepPendingUploads() {
  const pending = await prisma.$transaction(async (db) => {
    const snapshot = await readSnapshot(db);
    return queueUnusedImages(db, [], snapshot);
  }, { timeout: 120_000 });
  if (pending) await drainCloudinaryCleanupQueue();
  else await drainStaleReservations();
}

async function drainStaleReservations() {
  const stale = await prisma.cloudinaryPendingUpload.findMany({
    where: { url: null, createdAt: { lt: new Date(Date.now() - PENDING_UPLOAD_TTL_MS) } },
    select: { publicId: true }, orderBy: { createdAt: "asc" }, take: 100,
  });
  for (const item of stale) {
    try {
      await deleteCloudinaryPublicId(item.publicId);
      await releasePendingUpload(item.publicId);
    } catch {
      // La reserva queda registrada para reintentar el borrado en la próxima actividad.
    }
  }
}

function checkProductReferences(value: unknown, products: StoreProduct[]) {
  const ids = new Set(products.map((product) => product.id));
  if (referencedProductIds(value).some((id) => !ids.has(id))) {
    throw new ContentValidationError("La foto seleccionada pertenece a un producto que ya no existe.");
  }
}

function checkCards(cards: HomeCategoryCard[], categoryIds: Set<string>) {
  if (new Set(cards.map((card) => card.id)).size !== cards.length
    || new Set(cards.map((card) => card.categoryId)).size !== cards.length) {
    throw new ContentValidationError("Cada categoría destacada debe aparecer una sola vez en el inicio.");
  }
  if (cards.some((card) => !categoryIds.has(card.categoryId))) {
    throw new ContentValidationError("Elegí una categoría existente para cada tarjeta del inicio.");
  }
}

export async function saveContentAndCleanImages(key: ContentKey, value: unknown, uploadedUrls: string[] = []) {
  const parsed = contentSchemas[key].safeParse(value);
  if (!parsed.success) throw new ContentValidationError("El formato del contenido no es válido.");
  return prisma.$transaction(async (db) => {
    const current = await readSnapshot(db);
    let next = resolveContent(key, parsed.data);
    if (key === "categories") {
      const categories = next as ContentSnapshot["categories"];
      const ids = categories.map((category) => category.id);
      const names = categories.map((category) => category.name.trim().toLocaleLowerCase("es-AR"));
      if (new Set(ids).size !== ids.length || new Set(names).size !== names.length) {
        throw new ContentValidationError("Cada categoría debe tener un nombre y un identificador únicos.");
      }
      if (current.categories.some((category) => !ids.includes(category.id))) {
        throw new ContentValidationError("Para quitar una categoría de la tienda, ocultala. No se borran categorías desde este editor.");
      }
    }
    if (key === "products") {
      const products = next as StoreProduct[];
      if (new Set(products.map((product) => product.id)).size !== products.length) {
        throw new ContentValidationError("Hay productos con identificadores repetidos.");
      }
      const categories = new Map(current.categories.map((category) => [category.id, category.name]));
      if (products.some((product) => !categories.has(product.categoryId ?? ""))) {
        throw new ContentValidationError("Asigná a cada producto una categoría creada en el administrador.");
      }
      next = prepareProductsForSave(products.map((product) => ({
        ...product, category: categories.get(product.categoryId ?? "") ?? product.category,
      })), current.products, Date.now());
    }
    if (key === "texts") {
      const texts = next as ContentSnapshot["texts"];
      checkCards(texts.homeCategoryCards, new Set(current.categories.map((category) => category.id)));
      checkProductReferences([texts.split, texts.editorial, texts.homeCategoryCards], current.products);
    }
    if (key === "hero" || key === "instagram") checkProductReferences(next, current.products);
    if (key === "instagram") {
      const posts = next as ContentSnapshot["instagram"];
      if (posts.some((post) => !instagramPermalink(post.url))) {
        throw new ContentValidationError("Usá enlaces válidos a publicaciones o reels de Instagram.");
      }
      if (new Set(posts.map((post) => post.id)).size !== posts.length) {
        throw new ContentValidationError("Hay publicaciones de Instagram repetidas.");
      }
    }
    if (key === "categories") {
      const stored = await loadRelationalCatalog(db);
      await saveCategoryRows(db, next as ContentSnapshot["categories"], stored.categories);
    } else if (key === "products") {
      const stored = await loadRelationalCatalog(db);
      await saveProductRows(db, next as StoreProduct[], stored.products);
      const removedIds = stored.products.filter((product) => !(next as StoreProduct[]).some((item) => item.id === product.id)).map((product) => product.id);
      if (removedIds.length) {
        const where = { productId: { in: removedIds } };
        const references = await Promise.all([
          db.heroSlide.count({ where }), db.splitBanner.count({ where }), db.editorialBanner.count({ where }),
          db.curatedInstagramPost.count({ where }), db.homeCategoryCard.count({ where }),
        ]);
        if (references.some(Boolean)) {
          throw new ContentValidationError("Desvinculá el producto de banners, inicio e Instagram antes de eliminarlo.");
        }
        await db.product.deleteMany({ where: { id: { in: removedIds } } });
      }
    }
    else {
      if (key === "texts") {
        await saveHomeCategoryCardRows(db, (next as ContentSnapshot["texts"]).homeCategoryCards);
        await db.contentSection.upsert({ where: { key: "homeCategoryCards" }, create: { key: "homeCategoryCards" }, update: {} });
      }
      await saveRelationalContent(db, key, next);
    }
    if (key === "categories" || key === "products") {
      await db.contentSection.upsert({ where: { key }, create: { key }, update: {} });
    }
    const updated = { ...current, [key]: next } as ContentSnapshot;
    const cleanupPending = await queueUnusedImages(db, [...contentImageUrls(key, current[key]), ...uploadedUrls], updated);
    return { data: updated[key], cleanupPending };
  }, { timeout: 120_000 });
}

export async function saveTextSection(section: TextSectionKey, value: unknown, uploadedUrls: string[] = []) {
  const parsed = textSectionSchemas[section].safeParse(value);
  if (!parsed.success) throw new ContentValidationError("El formato de esta sección no es válido.");
  return prisma.$transaction(async (db) => {
    const nextValue = resolveContent("texts", { [section]: parsed.data })[section];
    const productIds = [...new Set(referencedProductIds(nextValue))];
    if (productIds.length) {
      const products = await db.product.findMany({ where: { id: { in: productIds } }, select: { id: true } });
      if (products.length !== productIds.length) {
        throw new ContentValidationError("La foto seleccionada pertenece a un producto que ya no existe.");
      }
    }
    let previousImageUrls: string[] = [];
    if (section === "homeCategoryCards") {
      const cards = nextValue as HomeCategoryCard[];
      const categoryIds = [...new Set(cards.map((card) => card.categoryId))];
      const categories = await db.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true } });
      checkCards(cards, new Set(categories.map((category) => category.id)));
      previousImageUrls = await saveHomeCategoryCardRows(db, cards);
      await db.contentSection.upsert({ where: { key: section }, create: { key: section }, update: {} });
    } else {
      if (section === "split") {
        const previous = await db.splitBanner.findUnique({ where: { id: 1 }, select: { img: true } });
        if (previous) previousImageUrls = [previous.img];
      } else if (section === "editorial") {
        const previous = await db.editorialBanner.findUnique({ where: { id: 1 }, select: { img: true } });
        if (previous) previousImageUrls = [previous.img];
      }
      await saveRelationalTextSection(db, section, nextValue);
    }
    const updated = await readSnapshot(db);
    const cleanupPending = await queueUnusedImages(db, [...previousImageUrls, ...uploadedUrls], updated);
    return { section, data: nextValue, cleanupPending };
  }, { timeout: 120_000 });
}

export async function deleteUnreferencedImages(urls: string[]) {
  const candidates = await prisma.$transaction(async (db) => {
    const snapshot = await readSnapshot(db);
    const unused = planCloudinaryDeletions(urls, referencedUrls(snapshot), "eterea");
    if (unused.length) {
      await db.cloudinaryCleanup.createMany({ data: unused.map((url) => ({ url })), skipDuplicates: true });
      await db.cloudinaryPendingUpload.deleteMany({ where: { url: { in: unused } } });
    }
    return unused;
  }, { timeout: 120_000 });
  const failed = await drainCloudinaryCleanupQueue();
  const remaining = await prisma.cloudinaryCleanup.findMany({ where: { url: { in: candidates } }, select: { url: true } });
  return { deleted: candidates.length - remaining.length, failed };
}

export async function drainCloudinaryCleanupQueue() {
  await drainStaleReservations();
  const snapshot = await readSnapshot(prisma);
  const referenced = referencedUrls(snapshot);
  const queue = await prisma.cloudinaryCleanup.findMany({ select: { url: true } });
  for (const item of queue) {
    if (referenced.has(item.url)) {
      await prisma.cloudinaryCleanup.delete({ where: { url: item.url } });
      continue;
    }
    try {
      await deleteCloudinaryImage(item.url);
      await prisma.cloudinaryCleanup.delete({ where: { url: item.url } });
    } catch {
      // Se conserva la URL para reintentar la limpieza en el próximo guardado.
    }
  }
  return prisma.cloudinaryCleanup.count();
}
