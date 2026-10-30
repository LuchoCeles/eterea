import type { StoreProduct } from "@/lib/content";
import type { CropSettings, ImageSettings } from "@/lib/image-presentation";

export function productEditorSnapshot(product: StoreProduct, images: readonly (string | { url: string; settings?: ImageSettings | null; coverSettings?: CropSettings | null })[]): string {
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
    images: images.map((item) => typeof item === "string" ? { url: item } : {
      url: item.url, settings: item.settings ?? null, coverSettings: item.coverSettings ?? null,
    }),
  });
}
