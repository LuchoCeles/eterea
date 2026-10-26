import type { Product } from "@/lib/products";

export function slugifyProductName(name: string) {
  return name.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-AR")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "prenda";
}

function idToken(id: string) {
  let hash = 0xcbf29ce484222325n;
  for (const character of id) {
    hash ^= BigInt(character.charCodeAt(0));
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return hash.toString(36).padStart(13, "0");
}

export function productSlug(product: Product, products: Product[]) {
  const base = slugifyProductName(product.name);
  const duplicates = products.filter((item) => slugifyProductName(item.name) === base);
  if (duplicates.length < 2) return base;

  const token = idToken(product.id);
  let length = 6;
  while (length < token.length && duplicates.some((item) => item.id !== product.id && idToken(item.id).slice(0, length) === token.slice(0, length))) {
    length += 1;
  }
  const suffix = duplicates.some((item) => item.id !== product.id && idToken(item.id) === token)
    ? `${token}-${encodeURIComponent(product.id)}`
    : token.slice(0, length);
  return `${base}-${suffix}`;
}

export function productHref(product: Product, products: Product[]) {
  return `/productos/${productSlug(product, products)}`;
}
