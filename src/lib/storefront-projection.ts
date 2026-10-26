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
    ...(product.tag ? { tag: product.tag } : {}),
    image: product.image,
    ...(product.sizes?.length ? { sizes: product.sizes } : {}),
    ...(product.colors?.length ? { colors: product.colors } : {}),
    section: product.section,
    hidden: product.hidden,
  };
}

export function contentForStorefront(content: ContentSnapshot): ContentSnapshot {
  return { ...content, products: content.products.map(productForListing) };
}
