import type { Product } from "./products";
import type { InstagramPost } from "./content";

export type Offers = { enabled: boolean; showSplit: boolean; showClub: boolean };

export function normalizeWhatsAppNumber(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\+?[\d\s().-]+$/.test(trimmed)) return null;
  const digits = trimmed.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

const promotionalText = /\d\s*x\s*\d|\d\s*%|\boff\b|descuento|env[ií]o gratis|cuotas|c[oó]digo|sale|oferta/i;

export function visibleAnnouncements(messages: string[], offersEnabled: boolean) {
  return messages.filter((message) => message.trim() && (offersEnabled || !promotionalText.test(message)));
}

export function visiblePaymentPrices<T extends { label: string }>(prices: T[], offersEnabled: boolean): T[] {
  return prices.filter(({ label }) => offersEnabled || !promotionalText.test(label));
}

export function hasRealDiscount(product: Product) {
  return Number.isFinite(product.price) && product.price > 0 && typeof product.oldPrice === "number" && Number.isFinite(product.oldPrice) && product.oldPrice > product.price;
}

export function visibleSaleProducts<T extends Product>(products: T[], offersEnabled: boolean): T[] {
  return offersEnabled ? products.filter(hasRealDiscount) : [];
}

export function productWithoutOffers<T extends Product>(product: T, offersEnabled: boolean): T {
  if (offersEnabled) return product;
  const { oldPrice: _oldPrice, tag, ...rest } = product;
  const regularPrice = hasRealDiscount(product) ? product.oldPrice ?? product.price : product.price;
  return { ...rest, price: regularPrice, ...(tag && !promotionalText.test(tag) ? { tag } : {}) } as T;
}

export function instagramPermalink(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !["www.instagram.com", "instagram.com"].includes(url.hostname)) return null;
    const match = url.pathname.match(/^\/(p|reel)\/([a-zA-Z0-9_-]+)\/?$/);
    return match ? `https://www.instagram.com/${match[1]}/${match[2]}/` : null;
  } catch {
    return null;
  }
}

export function instagramProfileUrl(value: string): string | null {
  const username = value.trim().replace(/^@/, "");
  return /^[a-zA-Z0-9._]{1,30}$/.test(username) ? `https://www.instagram.com/${username}/` : null;
}

export function instagramEmbedUrl(value: string): string | null {
  const permalink = instagramPermalink(value);
  return permalink ? `${permalink}embed/` : null;
}

export function visibleInstagramPosts(posts: InstagramPost[]): InstagramPost[] {
  return posts.flatMap((post) => {
    const url = instagramPermalink(post.url);
    return url ? [{ ...post, url, kind: url.includes("/reel/") ? "reel" as const : "post" as const }] : [];
  });
}

export function recentInstagramPosts(items: unknown, limit = 12): InstagramPost[] {
  if (!Array.isArray(items)) return [];
  const candidates = items.flatMap((item: { id?: unknown; permalink?: unknown; timestamp?: unknown }) => {
    if (typeof item?.id !== "string" || typeof item.permalink !== "string" || typeof item.timestamp !== "string") return [];
    const url = instagramPermalink(item.permalink);
    const publishedAt = Date.parse(item.timestamp);
    return url && Number.isFinite(publishedAt) ? [{
      id: item.id, url, publishedAt,
      kind: url.includes("/reel/") ? "reel" as const : "post" as const,
    }] : [];
  }).sort((a, b) => b.publishedAt - a.publishedAt);
  const seen = new Set<string>();
  return candidates.flatMap((item) => {
    if (seen.has(item.url)) return [];
    seen.add(item.url);
    return [{ id: item.id, url: item.url, image: "", title: "", kind: item.kind }];
  }).slice(0, limit);
}
