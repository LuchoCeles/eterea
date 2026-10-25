import { categoryIdForName, newArrivals, sale, sortProductsByCreation, type Product } from "@/lib/products";
import type { Offers } from "@/lib/storefront-rules";

export type ImageSource = { img: string; productId?: string };
export type Slide = ImageSource & { kicker: string; title: string; cta: string; promo: string; align: "left" | "right" };
export type StoreProduct = Product & { section: "nuevo" | "sale" };
export type StoreCategory = { id: string; name: string; img?: string; productId?: string };
export type InstagramPost = { id: string; url: string; image: string; productId?: string; title: string; kind: "post" | "reel" };
export type ContactSettings = { whatsapp: string };
export type HomeSections = {
  promoBar: boolean;
  hero: boolean;
  benefits: boolean;
  categories: boolean;
  newArrivals: boolean;
  offerBanners: boolean;
  marquee: boolean;
  sale: boolean;
  editorial: boolean;
  instagram: boolean;
  newsletter: boolean;
};
export type Texts = {
  offers: Offers;
  homeSections: HomeSections;
  benefits: { t: string; d: string }[];
  categories: StoreCategory[];
  split: ImageSource & { kicker: string; big: string; sub: string; cta: string };
  club: { kicker: string; big: string; text: string; code: string; cta: string };
  marquee: string[];
  editorial: ImageSource & { kicker: string; title: string; text: string; cta: string };
};

const placeholder = "/assets/eterea-placeholder.svg";

export const defaults = {
  promo: [
    "Etérea · New Concept",
    "El mar, la naturaleza y una forma de vestir",
    "Nuestro universo en @eterea.newconcept",
  ] as string[],
  hero: [
    { img: placeholder, kicker: "New Concept · Espíritu costero", title: "Etérea", cta: "Explorar prendas", align: "left", promo: "" },
    { img: placeholder, kicker: "Sastrería · Inspiración europea", title: "Etérea", cta: "Ver lo nuevo", align: "right", promo: "" },
    { img: placeholder, kicker: "Naturaleza · Texturas · Calma", title: "Etérea", cta: "Descubrir prendas", align: "left", promo: "" },
  ] as Slide[],
  products: [
    ...newArrivals.map((product) => ({ ...product, section: "nuevo" as const })),
    ...sale.map((product) => ({ ...product, section: "sale" as const })),
  ] as StoreProduct[],
  categories: [] as StoreCategory[],
  instagram: [] as InstagramPost[],
  contact: { whatsapp: "" } as ContactSettings,
  texts: {
    offers: { enabled: false, showSplit: false, showClub: false },
    homeSections: {
      promoBar: true,
      hero: true,
      benefits: true,
      categories: true,
      newArrivals: true,
      offerBanners: true,
      marquee: true,
      sale: true,
      editorial: true,
      instagram: true,
      newsletter: true,
    } as HomeSections,
    benefits: [
      { t: "Espíritu costero", d: "El mar como punto de partida" },
      { t: "Inspiración europea", d: "Una mirada delicada y actual" },
      { t: "Frescura natural", d: "Belleza que se lleva con comodidad" },
    ],
    categories: [...new Set([...newArrivals, ...sale].map((product) => product.category)), "Noche"].map((name) => ({ id: categoryIdForName(name), name, img: placeholder })),
    split: { kicker: "", big: "", sub: "", cta: "Ver prendas", img: placeholder },
    club: { kicker: "", big: "", text: "", code: "", cta: "Ver prendas" },
    marquee: ["Espíritu costero", "Etérea New Concept", "Frescura natural", "Inspiración europea"],
    editorial: {
      kicker: "New Concept",
      title: "El mar, nuestra forma de sentir.",
      text: "Etérea nace de una conexión con el mar y la naturaleza. Una mirada costera, con inspiración europea, que encuentra belleza en la frescura, la comodidad y los pequeños detalles. La flor, la espiral y la ola expresan esa esencia: natural, delicada y en movimiento.",
      cta: "Entrá en nuestro universo",
      img: placeholder,
    },
  } as Texts,
};

export type ContentKey = keyof typeof defaults;
export type ContentOf<K extends ContentKey> = (typeof defaults)[K];
export type ContentSnapshot = { [K in ContentKey]: ContentOf<K> };

export function resolveContent<K extends ContentKey>(key: K, data: unknown): ContentOf<K> {
  if (data == null) {
    if (key === "products") return resolveContent(key, structuredClone(defaults.products));
    return structuredClone(defaults[key]);
  }
  if (key === "contact") {
    return { ...defaults.contact, ...(data as Partial<ContactSettings>) } as ContentOf<K>;
  }
  if (key === "texts") {
    const saved = data as Partial<Texts>;
    return {
      ...defaults.texts,
      ...saved,
      offers: { ...defaults.texts.offers, ...saved.offers },
      homeSections: { ...defaults.texts.homeSections, ...saved.homeSections },
      split: { ...defaults.texts.split, ...saved.split },
      club: { ...defaults.texts.club, ...saved.club },
      editorial: { ...defaults.texts.editorial, ...saved.editorial },
      categories: (saved.categories ?? defaults.texts.categories).map((category) => ({ ...category, id: category.id || categoryIdForName(category.name) })),
    } as ContentOf<K>;
  }
  if (key === "products") {
    return sortProductsByCreation((data as StoreProduct[]).map((product) => ({
      ...product,
      categoryId: product.categoryId || categoryIdForName(product.category),
    }))) as ContentOf<K>;
  }
  if (key === "categories") {
    return (data as StoreCategory[]).map((category) => ({ ...category, id: category.id || categoryIdForName(category.name) })) as ContentOf<K>;
  }
  return data as ContentOf<K>;
}

export function categoriesForProducts(initialCategories: StoreCategory[], products: StoreProduct[]): StoreCategory[] {
  const categories = [...initialCategories];
  for (const product of products) {
    if (!product.category?.trim()) continue;
    const id = product.categoryId || categoryIdForName(product.category);
    if (!categories.some((category) => category.id === id)) {
      categories.push({ id, name: product.category });
    }
  }
  return categories;
}

export function catalogCategories(saved: StoreCategory[] | null, texts: Texts, products: StoreProduct[]): StoreCategory[] {
  return saved === null ? categoriesForProducts(texts.categories, products) : resolveContent("categories", saved);
}

export function productsWithCategoryNames(products: StoreProduct[], categories: StoreCategory[]): StoreProduct[] {
  const names = new Map(categories.map((category) => [category.id, category.name]));
  return products.map((product) => ({ ...product, category: names.get(product.categoryId ?? "") ?? product.category }));
}
