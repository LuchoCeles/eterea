import { PRODUCT_IMAGE_FALLBACK, type Product } from "@/lib/products";

export type ImageSourceValue = { img?: string; image?: string; productId?: string };

export function resolveImageSource(source: ImageSourceValue, products: Product[]): string {
  if (source.productId) {
    return products.find((product) => product.id === source.productId)?.image || PRODUCT_IMAGE_FALLBACK;
  }
  return source.img || source.image || PRODUCT_IMAGE_FALLBACK;
}

export function referencedProductIds(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(referencedProductIds);
  if (!value || typeof value !== "object") return [];
  const item = value as Record<string, unknown>;
  return [
    ...(typeof item.productId === "string" ? [item.productId] : []),
    ...Object.entries(item).filter(([key]) => key !== "productId").flatMap(([, nested]) => referencedProductIds(nested)),
  ];
}
