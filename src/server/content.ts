import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { planCloudinaryDeletions } from "@/lib/cloudinary-media";
import { catalogCategories, ContentKey, ContentSnapshot, defaults, legacyHomeCategoryCards, productsWithCategoryNames, resolveContent, type StoreCategory, type StoreProduct } from "@/lib/content";
import { prepareProductsForSave } from "@/lib/products";
import { referencedProductIds } from "@/lib/image-source";
import { contentSchemas } from "@/lib/content-schema";
import { loadRelationalCatalog, saveCategoryRows, saveHomeCategoryCardRows, saveProductRows } from "@/server/catalog";
import { cloudinaryPublicId, deleteCloudinaryImage } from "@/server/cloudinary";
import { prisma } from "@/server/prisma";

const CLEANUP_QUEUE_KEY = "__cloudinary_cleanup";
const CATALOG_MARKER_KEY = "__catalog_relational_v1";
const IMAGE_REFERENCE_KEYS: ContentKey[] = ["hero", "texts", "instagram"];

export const contentKeys = Object.keys(defaults) as ContentKey[];

export class ContentValidationError extends Error {}

export async function loadContentSnapshot(): Promise<ContentSnapshot> {
  const rows = await prisma.siteContent.findMany({ where: { key: { in: [...contentKeys, CATALOG_MARKER_KEY] } } }).catch(() => []);
  const saved = new Map(rows.map((row) => [row.key, row.data]));
  const snapshot = Object.fromEntries(contentKeys.map((key) => {
    const parsed = contentSchemas[key].safeParse(saved.get(key));
    return [key, resolveContent(key, parsed.success ? parsed.data : undefined)];
  })) as ContentSnapshot;
  if (saved.get(CATALOG_MARKER_KEY) === true) {
    const catalog = await loadRelationalCatalog(prisma);
    snapshot.categories = resolveContent("categories", catalog.categories);
    snapshot.products = resolveContent("products", catalog.products);
    snapshot.texts = resolveContent("texts", { ...snapshot.texts, homeCategoryCards: catalog.homeCategoryCards });
  } else {
    const parsedCategories = contentSchemas.categories.safeParse(saved.get("categories"));
    snapshot.categories = catalogCategories(parsedCategories.success ? parsedCategories.data as StoreCategory[] : null, snapshot.texts, snapshot.products);
    const legacyCards = legacyHomeCategoryCards(snapshot.categories, saved.get("texts"), saved.get("categories"), snapshot.products);
    if (legacyCards) snapshot.texts = resolveContent("texts", { ...snapshot.texts, homeCategoryCards: legacyCards });
  }
  snapshot.products = productsWithCategoryNames(snapshot.products, snapshot.categories);
  return snapshot;
}

function withoutCatalogFields(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const { categories: _categories, homeCategoryCards: _homeCategoryCards, ...rest } = value as Record<string, unknown>;
  void _categories;
  void _homeCategoryCards;
  return rest;
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

async function referencedImageUrls(rows: { key: string; data: unknown }[]) {
  const migrated = rows.some((row) => row.key === CATALOG_MARKER_KEY && row.data === true);
  const catalog = migrated ? await loadRelationalCatalog(prisma) : null;
  return new Set([
    ...rows.filter((row) => row.key !== CLEANUP_QUEUE_KEY && (!migrated || (row.key !== "products" && row.key !== "categories")))
      .flatMap((row) => imageUrls(row.key === "texts" && migrated ? withoutCatalogFields(row.data) : row.data)),
    ...imageUrls(catalog?.products), ...imageUrls(catalog?.homeCategoryCards),
  ]);
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
    const [previous, queue, textsRow, productsRow, categoriesRow, marker] = await Promise.all([
      transaction.siteContent.findUnique({ where: { key }, select: { data: true } }),
      transaction.siteContent.findUnique({ where: { key: CLEANUP_QUEUE_KEY }, select: { data: true } }),
      transaction.siteContent.findUnique({ where: { key: "texts" }, select: { data: true } }),
      transaction.siteContent.findUnique({ where: { key: "products" }, select: { data: true } }),
      transaction.siteContent.findUnique({ where: { key: "categories" }, select: { data: true } }),
      transaction.siteContent.findUnique({ where: { key: CATALOG_MARKER_KEY }, select: { data: true } }),
    ]);
    const relational = marker?.data === true ? await loadRelationalCatalog(transaction) : null;
    if (!relational && (key === "categories" || key === "products" || key === "texts")) {
      throw new ContentValidationError("Primero hay que migrar el catálogo a las tablas de la base de datos.");
    }
    const currentProducts = relational?.products ?? resolveContent("products", productsRow?.data ?? defaults.products);
    const currentTexts = resolveContent("texts", textsRow?.data);
    const parsedCategories = contentSchemas.categories.safeParse(categoriesRow?.data);
    const availableCategories = relational?.categories ?? catalogCategories(parsedCategories.success ? parsedCategories.data as StoreCategory[] : null, currentTexts, currentProducts);
    const homeCategoryCards = relational?.homeCategoryCards ?? legacyHomeCategoryCards(availableCategories, textsRow?.data, categoriesRow?.data, currentProducts) ?? currentTexts.homeCategoryCards;
    let merged = resolveContent(key, value);
    if (key === "categories") {
      const nextCategories = merged as ContentSnapshot["categories"];
      const ids = nextCategories.map((category) => category.id);
      const names = nextCategories.map((category) => category.name.trim().toLocaleLowerCase("es-AR"));
      if (new Set(ids).size !== ids.length || new Set(names).size !== names.length) {
        throw new ContentValidationError("Cada categoría debe tener un nombre y un identificador únicos.");
      }
      if (relational?.categories.some((category) => !ids.includes(category.id))) {
        throw new ContentValidationError("Para quitar una categoría de la tienda, ocultala. No se borran categorías desde este editor.");
      }
    }
    if (key === "texts") {
      const cards = (merged as ContentSnapshot["texts"]).homeCategoryCards;
      const categoryIds = new Set(availableCategories.map((category) => category.id));
      if (new Set(cards.map((card) => card.id)).size !== cards.length || new Set(cards.map((card) => card.categoryId)).size !== cards.length) {
        throw new ContentValidationError("Cada categoría destacada debe aparecer una sola vez en el inicio.");
      }
      if (relational?.homeCategoryCards.some((card) => !cards.some((next) => next.id === card.id))) {
        throw new ContentValidationError("Para quitar una tarjeta del inicio, ocultala.");
      }
      if (cards.some((card) => !categoryIds.has(card.categoryId))) {
        throw new ContentValidationError("Elegí una categoría existente para cada tarjeta del inicio.");
      }
    }
    if (key === "products") {
      const nextProducts = merged as StoreProduct[];
      if (new Set(nextProducts.map((product) => product.id)).size !== nextProducts.length) {
        throw new ContentValidationError("Hay productos con identificadores repetidos.");
      }
      if (relational?.products.some((product) => !nextProducts.some((next) => next.id === product.id))) {
        throw new ContentValidationError("Para quitar un producto de la tienda, ocultalo.");
      }
      const categories = new Map(availableCategories.map((category) => [category.id, category.name]));
      if (nextProducts.some((product) => !categories.has(product.categoryId ?? ""))) {
        throw new ContentValidationError("Asigná a cada producto una categoría creada en el administrador.");
      }
      const imageSections = await transaction.siteContent.findMany({ where: { key: { in: IMAGE_REFERENCE_KEYS } }, select: { data: true } });
      const remainingIds = new Set(nextProducts.map((product) => product.id));
      if (imageSections.some((section) => referencedProductIds(withoutCatalogFields(section.data)).some((id) => !remainingIds.has(id)))) {
        throw new ContentValidationError("Hay productos usados como foto en otras secciones. Quitá esas referencias antes de borrar el producto.");
      }
      if (homeCategoryCards.some((card) => card.productId && !remainingIds.has(card.productId))) {
        throw new ContentValidationError("Hay productos usados como foto en el inicio. Quitá esas referencias antes de borrarlos.");
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
    const previousValue = key === "products" ? relational?.products
      : key === "categories" ? relational?.categories
      : key === "texts" ? { ...currentTexts, homeCategoryCards } : previous?.data;
    let savedData: unknown = merged;
    if (key === "categories") {
      await saveCategoryRows(transaction, merged as StoreCategory[], relational?.categories ?? []);
    } else if (key === "products") {
      await saveProductRows(transaction, merged as StoreProduct[], relational?.products ?? []);
    } else {
      if (key === "texts") await saveHomeCategoryCardRows(transaction, (merged as ContentSnapshot["texts"]).homeCategoryCards, relational?.homeCategoryCards ?? []);
      const data = (key === "texts" ? withoutCatalogFields(merged) : merged) as Prisma.InputJsonValue;
      const row = await transaction.siteContent.upsert({ where: { key }, create: { key, data }, update: { data } });
      if (key !== "texts") savedData = row.data;
    }
    const rows = await transaction.siteContent.findMany({ select: { key: true, data: true } });
    const currentCatalog = relational ? await loadRelationalCatalog(transaction) : null;
    const referenced = new Set([
      ...rows.filter((item) => item.key !== CLEANUP_QUEUE_KEY && (!relational || (item.key !== "products" && item.key !== "categories")))
        .flatMap((item) => imageUrls(item.key === "texts" && relational ? withoutCatalogFields(item.data) : item.data)),
      ...imageUrls(currentCatalog?.products), ...imageUrls(currentCatalog?.homeCategoryCards),
    ]);
    const candidates = new Set([...queuedUrls(queue?.data), ...imageUrls(previousValue), ...uploadedUrls.filter((url) => cloudinaryPublicId(url))]);
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
    return savedData;
  }, { timeout: 120_000 });

  const cleanupPending = await drainCloudinaryCleanupQueue().catch(() => 1);
  return { data: saved, cleanupPending };
}

export async function deleteUnreferencedImages(urls: string[]) {
  const rows = await prisma.siteContent.findMany({ select: { key: true, data: true } });
  const referenced = await referencedImageUrls(rows);
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
  const referenced = await referencedImageUrls(rows);
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
  const remainingReferences = await referencedImageUrls(remainingRows);
  const nextQueue = remainingQueue.filter((url) => !deleted.has(url) && !remainingReferences.has(url));
  await persistCleanupQueue(nextQueue);
  return nextQueue.length;
}
