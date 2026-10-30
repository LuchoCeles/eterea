import type { StoreProduct } from "@/lib/content";

export function createProductDraft(category?: { id: string; name: string }): StoreProduct {
  return {
    id: crypto.randomUUID(),
    name: "",
    categoryId: category?.id ?? "",
    category: category?.name ?? "",
    createdAt: new Date().toISOString(),
    price: 0,
    paymentPrices: [{ label: "Transferencia", price: 0 }],
    image: "",
    images: [],
    description: "",
    sizes: [],
    colors: [],
    soldOutColors: [],
    soldOut: false,
    section: null,
    hidden: false,
  };
}
