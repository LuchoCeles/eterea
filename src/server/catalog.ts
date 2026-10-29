import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { HomeCategoryCard, StoreCategory, StoreProduct } from "@/lib/content";
import { paymentPriceId } from "@/lib/catalog-ids";
import { loadProductRelations } from "@/server/product-relations";

type CatalogDb = Pick<Prisma.TransactionClient, "category" | "product" | "productPaymentPrice" | "productImage" | "productSize" | "productColor" | "homeCategoryCard" | "$queryRaw">;

export async function loadRelationalCatalog(db: CatalogDb, includeCards = true) {
  const [categoryRows, productRows, cardRows, relations] = await Promise.all([
    db.category.findMany({ orderBy: [{ position: "asc" }, { id: "asc" }], select: { id: true, name: true, hidden: true } }),
    db.product.findMany({ orderBy: [{ position: "asc" }, { id: "asc" }] }),
    includeCards ? db.homeCategoryCard.findMany({ orderBy: [{ position: "asc" }, { id: "asc" }],
      select: { id: true, categoryId: true, img: true, hidden: true, productId: true, position: true } })
      : Promise.resolve([]),
    loadProductRelations(db),
  ]);
  const categories: StoreCategory[] = categoryRows.map((row) => ({ id: row.id, name: row.name, hidden: row.hidden }));
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
  const products: StoreProduct[] = productRows.map((row) => {
    const related = relations.get(row.id);
    const images = related?.images ?? [];
    return {
      id: row.id,
      name: row.name,
      categoryId: row.categoryId,
      category: categoryNames.get(row.categoryId) ?? "",
      price: row.price.toNumber(),
      ...(row.oldPrice ? { oldPrice: row.oldPrice.toNumber() } : {}),
      ...(row.tag ? { tag: row.tag } : {}),
      image: images[0] ?? row.image,
      images: images.length ? images : (row.image ? [row.image] : []),
      description: row.description ?? "",
      sizes: related?.sizes ?? [],
      colors: related?.colors ?? [],
      soldOut: row.soldOut,
      soldOutColors: related?.soldOutColors ?? [],
      section: row.section as StoreProduct["section"],
      hidden: row.hidden,
      ...(row.createdAt ? { createdAt: row.createdAt.toISOString() } : {}),
      ...(related?.paymentPrices.length ? { paymentPrices: related.paymentPrices } : {}),
    };
  });
  const homeCategoryCards: HomeCategoryCard[] = cardRows.map((row) => ({
    id: row.id, categoryId: row.categoryId, img: row.img, hidden: row.hidden,
    ...(row.productId ? { productId: row.productId } : {}),
  }));
  return { categories, products, homeCategoryCards, cardRows };
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
    && (a.description ?? "") === (b.description ?? "")
    && !!a.hidden === !!b.hidden && a.createdAt === b.createdAt
    && !!a.soldOut === !!b.soldOut
    && JSON.stringify(a.images ?? (a.image ? [a.image] : [])) === JSON.stringify(b.images ?? (b.image ? [b.image] : []))
    && JSON.stringify(a.sizes ?? []) === JSON.stringify(b.sizes ?? [])
    && JSON.stringify(a.colors ?? []) === JSON.stringify(b.colors ?? [])
    && JSON.stringify(a.soldOutColors ?? []) === JSON.stringify(b.soldOutColors ?? [])
    && JSON.stringify(a.paymentPrices ?? []) === JSON.stringify(b.paymentPrices ?? []);
}

export async function saveProductRows(db: CatalogDb, products: StoreProduct[], current: StoreProduct[]) {
  const currentById = new Map(current.map((product) => [product.id, product]));
  const changedPositions = new Set(products.flatMap((product, position) =>
    current[position] && sameProduct(current[position], product) ? [] : [position]));
  const changedPrices = products.filter((product, position) =>
    changedPositions.has(position)
    && JSON.stringify(currentById.get(product.id)?.paymentPrices ?? []) !== JSON.stringify(product.paymentPrices ?? []));
  const activePrices = changedPrices.length ? await db.productPaymentPrice.findMany({
    where: { productId: { in: changedPrices.map((product) => product.id) }, active: true },
    select: { id: true, productId: true },
  }) : [];
  const nextPriceIds = new Set(changedPrices.flatMap((product) =>
    (product.paymentPrices ?? []).map((_, index) => paymentPriceId(product.id, index))));
  const removedPriceIds = activePrices.filter((price) => !nextPriceIds.has(price.id)).map((price) => price.id);
  if (removedPriceIds.length) await db.productPaymentPrice.updateMany({
    where: { id: { in: removedPriceIds } }, data: { active: false },
  });
  for (const [position, product] of products.entries()) {
    if (!changedPositions.has(position)) continue;
    const previous = currentById.get(product.id);
    const images = product.images ?? (product.image ? [product.image] : []);
    const data = {
      categoryId: product.categoryId!, name: product.name, price: product.price,
      oldPrice: product.oldPrice ?? null, tag: product.tag ?? null, image: images[0] ?? "",
      description: product.description ?? "",
      section: product.section, hidden: product.hidden === true, soldOut: product.soldOut === true,
      createdAt: product.createdAt ? new Date(product.createdAt) : null, position,
    };
    await db.product.upsert({ where: { id: product.id }, create: { id: product.id, ...data }, update: data });
    if (JSON.stringify(previous?.images ?? (previous?.image ? [previous.image] : [])) !== JSON.stringify(images)) {
      await db.productImage.deleteMany({ where: { productId: product.id } });
      if (images.length) await db.productImage.createMany({
        data: images.map((url, imagePosition) => ({ productId: product.id, position: imagePosition, url })),
      });
    }
    if (JSON.stringify(previous?.sizes ?? []) !== JSON.stringify(product.sizes ?? [])) {
      await db.productSize.deleteMany({ where: { productId: product.id } });
      if (product.sizes?.length) await db.productSize.createMany({
        data: product.sizes.map((label, optionPosition) => ({ productId: product.id, position: optionPosition, label })),
      });
    }
    if (JSON.stringify(previous?.colors ?? []) !== JSON.stringify(product.colors ?? [])
      || JSON.stringify(previous?.soldOutColors ?? []) !== JSON.stringify(product.soldOutColors ?? [])) {
      await db.productColor.deleteMany({ where: { productId: product.id } });
      if (product.colors?.length) await db.productColor.createMany({
        data: product.colors.map((label, optionPosition) => ({
          productId: product.id, position: optionPosition, label,
          soldOut: product.soldOutColors?.includes(label) === true,
        })),
      });
    }
    if (JSON.stringify(previous?.paymentPrices ?? []) === JSON.stringify(product.paymentPrices ?? [])) continue;
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

