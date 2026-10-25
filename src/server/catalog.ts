import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { HomeCategoryCard, StoreCategory, StoreProduct } from "@/lib/content";
import { paymentPriceId } from "@/lib/catalog-ids";

type CatalogDb = Pick<Prisma.TransactionClient, "category" | "product" | "productPaymentPrice" | "homeCategoryCard">;

export async function loadRelationalCatalog(db: CatalogDb) {
  const [categoryRows, productRows, cardRows] = await Promise.all([
    db.category.findMany({ orderBy: [{ position: "asc" }, { id: "asc" }] }),
    db.product.findMany({
      include: { category: true, paymentPrices: { where: { active: true }, orderBy: [{ position: "asc" }, { id: "asc" }] } },
      orderBy: [{ position: "asc" }, { id: "asc" }],
    }),
    db.homeCategoryCard.findMany({ orderBy: [{ position: "asc" }, { id: "asc" }] }),
  ]);
  const categories: StoreCategory[] = categoryRows.map((row) => ({ id: row.id, name: row.name, hidden: row.hidden }));
  const products: StoreProduct[] = productRows.map((row) => ({
    id: row.id,
    name: row.name,
    categoryId: row.categoryId,
    category: row.category.name,
    price: row.price.toNumber(),
    ...(row.oldPrice ? { oldPrice: row.oldPrice.toNumber() } : {}),
    ...(row.tag ? { tag: row.tag } : {}),
    image: row.image,
    section: row.section as StoreProduct["section"],
    hidden: row.hidden,
    ...(row.createdAt ? { createdAt: row.createdAt.toISOString() } : {}),
    ...(row.paymentPrices.length ? { paymentPrices: row.paymentPrices.map((item) => ({ label: item.label, price: item.price.toNumber() })) } : {}),
  }));
  const homeCategoryCards: HomeCategoryCard[] = cardRows.map((row) => ({
    id: row.id, categoryId: row.categoryId, img: row.img, hidden: row.hidden,
    ...(row.productId ? { productId: row.productId } : {}),
  }));
  return { categories, products, homeCategoryCards };
}

export async function saveCategoryRows(db: CatalogDb, categories: StoreCategory[], current: StoreCategory[]) {
  for (const [position, category] of categories.entries()) {
    const previous = current[position];
    if (previous?.id === category.id && previous.name === category.name && !!previous.hidden === !!category.hidden) continue;
    await db.category.upsert({
      where: { id: category.id },
      create: { id: category.id, name: category.name, hidden: category.hidden === true, position },
      update: { name: category.name, hidden: category.hidden === true, position },
    });
  }
}

function sameProduct(a: StoreProduct, b: StoreProduct) {
  return a.id === b.id && a.categoryId === b.categoryId && a.name === b.name && a.price === b.price
    && a.oldPrice === b.oldPrice && a.tag === b.tag && a.image === b.image && a.section === b.section
    && !!a.hidden === !!b.hidden && a.createdAt === b.createdAt
    && JSON.stringify(a.paymentPrices ?? []) === JSON.stringify(b.paymentPrices ?? []);
}

export async function saveProductRows(db: CatalogDb, products: StoreProduct[], current: StoreProduct[]) {
  const currentById = new Map(current.map((product) => [product.id, product]));
  for (const [position, product] of products.entries()) {
    if (current[position] && sameProduct(current[position], product)) continue;
    const data = {
      categoryId: product.categoryId!, name: product.name, price: product.price,
      oldPrice: product.oldPrice ?? null, tag: product.tag ?? null, image: product.image,
      section: product.section, hidden: product.hidden === true,
      createdAt: product.createdAt ? new Date(product.createdAt) : null, position,
    };
    await db.product.upsert({ where: { id: product.id }, create: { id: product.id, ...data }, update: data });
    if (JSON.stringify(currentById.get(product.id)?.paymentPrices ?? []) === JSON.stringify(product.paymentPrices ?? [])) continue;
    const currentPrices = await db.productPaymentPrice.findMany({ where: { productId: product.id, active: true }, select: { id: true } });
    const nextPriceIds = new Set((product.paymentPrices ?? []).map((_, index) => paymentPriceId(product.id, index)));
    for (const oldPrice of currentPrices) {
      if (!nextPriceIds.has(oldPrice.id)) await db.productPaymentPrice.update({ where: { id: oldPrice.id }, data: { active: false } });
    }
    for (const [pricePosition, item] of (product.paymentPrices ?? []).entries()) {
      const id = paymentPriceId(product.id, pricePosition);
      await db.productPaymentPrice.upsert({
        where: { id },
        create: { id, productId: product.id, label: item.label, price: item.price, position: pricePosition, active: true },
        update: { label: item.label, price: item.price, position: pricePosition, active: true },
      });
    }
  }
}

