export type Product = {
  id: string;
  name: string;
  category: string;
  categoryId?: string;
  createdAt?: string;
  price: number;
  oldPrice?: number;
  paymentPrices?: { label: string; price: number }[];
  tag?: string;
  image: string;
  images?: string[];
  description?: string;
  sizes?: string[];
  colors?: string[];
  soldOut?: boolean;
  soldOutColors?: string[];
};

export function categoryIdForName(name: string) {
  return `legacy-${name.trim().toLocaleLowerCase("es-AR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

export function sortProductsByCreation<T extends Product>(products: T[]): T[] {
  return [...products].sort((a, b) => {
    const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
    const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
    return bTime - aTime;
  });
}

export function isProductSoldOut(product: Product): boolean {
  return product.soldOut === true || !!(product.colors?.length && product.colors.every((color) => product.soldOutColors?.includes(color)));
}

export function prepareProductsForSave<T extends Product>(incoming: T[], current: T[], now: number): T[] {
  const existing = new Map(current.map((product) => [product.id, product.createdAt]));
  const previousOrder = new Map(current.map((product, index) => [product.id, index]));
  return sortProductsByCreation(incoming.map((product, index) => ({
    ...product,
    createdAt: existing.has(product.id) ? existing.get(product.id) : new Date(now + index).toISOString(),
  }))).sort((a, b) => !a.createdAt && !b.createdAt
    ? (previousOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (previousOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER)
    : 0);
}

export type CartItem = Product & { quantity: number; lineKey: string; size?: string; color?: string };

export const PRODUCT_IMAGE_FALLBACK = "/assets/eterea-placeholder.svg";

const image = PRODUCT_IMAGE_FALLBACK;

export const newArrivals: Product[] = [
  { id: "1", name: "Vestido Lino Aura", category: "Vestidos", price: 68900, tag: "Nuevo", image },
  { id: "2", name: "Blazer Noir Sastrero", category: "Abrigos", price: 89900, image },
  { id: "3", name: "Top Rib Oliva", category: "Tops", price: 28500, tag: "Nuevo", image },
  { id: "4", name: "Pantalón Duna", category: "Pantalones", price: 54900, image },
  { id: "5", name: "Falda Satén Arcilla", category: "Faldas", price: 46900, tag: "Nuevo", image },
  { id: "6", name: "Camisa Poplin Blanca", category: "Camisas", price: 42900, image },
];

export const sale: Product[] = [
  { id: "7", name: "Cárdigan Cacao", category: "Tejidos", price: 41900, oldPrice: 59900, tag: "-30%", image },
  { id: "8", name: "Slip Dress Medianoche", category: "Vestidos", price: 47900, oldPrice: 63900, tag: "-25%", image },
  { id: "9", name: "Pantalón Duna", category: "Pantalones", price: 43900, oldPrice: 54900, tag: "-20%", image },
  { id: "10", name: "Top Rib Oliva", category: "Tops", price: 19900, oldPrice: 28500, tag: "-30%", image },
  { id: "11", name: "Falda Satén Arcilla", category: "Faldas", price: 35100, oldPrice: 46900, tag: "-25%", image },
];

export const formatPrice = (amount: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(amount);
