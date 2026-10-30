import type { StoreProduct } from "@/lib/content";

export function productEditorSnapshot(product: StoreProduct, images: readonly string[]): string {
  return JSON.stringify({
    name: product.name,
    categoryId: product.categoryId ?? "",
    category: product.category,
    section: product.section ?? null,
    hidden: product.hidden === true,
    soldOut: product.soldOut === true,
    description: product.description ?? "",
    price: product.price,
    oldPrice: product.oldPrice ?? null,
    paymentPrices: product.paymentPrices ?? [],
    sizes: product.sizes ?? [],
    colors: product.colors ?? [],
    soldOutColors: product.soldOutColors ?? [],
    images,
  });
}
