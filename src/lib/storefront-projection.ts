import type { ContentSnapshot, StoreProduct } from "@/lib/content";

export function productForListing(product: StoreProduct): StoreProduct {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    categoryId: product.categoryId,
    createdAt: product.createdAt,
    price: product.price,
    ...(product.oldPrice !== undefined ? { oldPrice: product.oldPrice } : {}),
    ...(product.paymentPrices ? { paymentPrices: product.paymentPrices } : {}),
    image: product.image,
    ...(product.coverSettings ? { coverSettings: product.coverSettings } : {}),
    ...(product.sizes?.length ? { sizes: product.sizes } : {}),
    ...(product.colors?.length ? { colors: product.colors } : {}),
    ...(product.soldOut ? { soldOut: true } : {}),
    ...(product.soldOutColors?.length ? { soldOutColors: product.soldOutColors } : {}),
    section: product.section,
    hidden: product.hidden,
  };
}

export function contentForStorefront(content: ContentSnapshot): ContentSnapshot {
  return { ...content, products: content.products.map(productForListing) };
}
