import "dotenv/config";
import { PrismaClient } from "@/generated/prisma/client";
import { paymentPriceId } from "@/lib/catalog-ids";
import { catalogCategories, defaults, legacyHomeCategoryCards, resolveContent, type StoreCategory, type StoreProduct } from "@/lib/content";
import { contentSchemas } from "@/lib/content-schema";
import { createMariaDbAdapter } from "@/server/prisma-adapter";

const MARKER_KEY = "__catalog_relational_v1";
const prisma = new PrismaClient({ adapter: createMariaDbAdapter() });

function parseSaved<K extends "products" | "categories" | "texts">(key: K, data: unknown) {
  if (data === undefined) return undefined;
  const parsed = contentSchemas[key].safeParse(data);
  if (!parsed.success) throw new Error(`El contenido heredado de «${key}» no es válido. Revisalo antes de migrar.`);
  return parsed.data;
}

try {
  const [marker, productRow, categoryRow, textsRow] = await Promise.all([
    prisma.siteContent.findUnique({ where: { key: MARKER_KEY } }),
    prisma.siteContent.findUnique({ where: { key: "products" } }),
    prisma.siteContent.findUnique({ where: { key: "categories" } }),
    prisma.siteContent.findUnique({ where: { key: "texts" } }),
  ]);
  if (marker?.data === true) {
    console.info("El catálogo ya está migrado a tablas propias.");
    process.exitCode = 0;
  } else {
    const products = resolveContent("products", parseSaved("products", productRow?.data) ?? defaults.products);
    const texts = resolveContent("texts", parseSaved("texts", textsRow?.data));
    const savedCategories = parseSaved("categories", categoryRow?.data) as StoreCategory[] | undefined;
    const categories = catalogCategories(savedCategories ?? null, texts, products);
    const cards = legacyHomeCategoryCards(categories, textsRow?.data, categoryRow?.data, products) ?? texts.homeCategoryCards;
    const categoryIds = new Set(categories.map((category) => category.id));
    const productIds = new Set(products.map((product) => product.id));
    if (categoryIds.size !== categories.length || new Set(categories.map((category) => category.name.toLocaleLowerCase("es-AR"))).size !== categories.length) {
      throw new Error("Las categorías heredadas tienen nombres o identificadores repetidos.");
    }
    if (productIds.size !== products.length || products.some((product) => !categoryIds.has(product.categoryId ?? ""))) {
      throw new Error("Hay productos heredados sin una categoría válida o con identificadores repetidos.");
    }
    if (new Set(cards.map((card) => card.categoryId)).size !== cards.length || cards.some((card) => !categoryIds.has(card.categoryId))) {
      throw new Error("Los destacados heredados tienen categorías repetidas o inexistentes.");
    }

    await prisma.$transaction(async (transaction) => {
      const [categoryCount, productCount, cardCount] = await Promise.all([
        transaction.category.count(), transaction.product.count(), transaction.homeCategoryCard.count(),
      ]);
      if (categoryCount || productCount || cardCount) throw new Error("Ya hay datos en las tablas del catálogo; se detuvo la importación para no sobrescribirlos.");
      for (const [position, category] of categories.entries()) {
        await transaction.category.create({ data: { id: category.id, name: category.name, hidden: category.hidden === true, position } });
      }
      for (const [position, product] of products.entries()) {
        await transaction.product.create({ data: {
          id: product.id, categoryId: product.categoryId!, name: product.name, price: product.price,
          oldPrice: product.oldPrice ?? null, tag: product.tag ?? null, image: product.image,
          section: product.section, hidden: product.hidden === true,
          createdAt: product.createdAt ? new Date(product.createdAt) : null, position,
        } });
        for (const [pricePosition, item] of (product.paymentPrices ?? []).entries()) {
          await transaction.productPaymentPrice.create({ data: {
            id: paymentPriceId(product.id, pricePosition), productId: product.id,
            label: item.label, price: item.price, position: pricePosition, active: true,
          } });
        }
      }
      for (const [position, card] of cards.entries()) {
        await transaction.homeCategoryCard.create({ data: {
          id: card.id, categoryId: card.categoryId,
          productId: card.productId && productIds.has(card.productId) ? card.productId : null,
          img: card.img, hidden: card.hidden !== false, position,
        } });
      }
      await transaction.siteContent.create({ data: { key: MARKER_KEY, data: true } });
    }, { timeout: 120_000 });
    console.info(`Catálogo migrado: ${categories.length} categorías, ${products.length} productos y ${cards.length} destacados.`);
  }
} finally {
  await prisma.$disconnect();
}
