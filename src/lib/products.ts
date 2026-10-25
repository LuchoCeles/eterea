export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  paymentPrices?: { label: string; price: number }[];
  tag?: string;
  image: string;
};

export type CartItem = Product & { quantity: number };

const image = "/assets/eterea-placeholder.svg";

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
