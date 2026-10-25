import { z, type ZodType } from "zod";
import type { ContentKey } from "@/lib/content";
import { normalizeWhatsAppNumber } from "@/lib/storefront-rules";

const shortText = z.string().max(4000);
const image = z.string().max(4000);
const offers = z.object({ enabled: z.boolean(), showSplit: z.boolean(), showClub: z.boolean() }).partial().passthrough();
const homeSections = z.object({
  promoBar: z.boolean(),
  hero: z.boolean(),
  benefits: z.boolean(),
  categories: z.boolean(),
  newArrivals: z.boolean(),
  offerBanners: z.boolean(),
  marquee: z.boolean(),
  sale: z.boolean(),
  editorial: z.boolean(),
  instagram: z.boolean(),
  newsletter: z.boolean(),
}).partial().passthrough();
const slide = z.object({
  img: image,
  kicker: shortText,
  title: shortText,
  cta: shortText,
  promo: shortText,
  align: z.enum(["left", "right"]),
});
const product = z.object({
  id: z.string().min(1).max(191),
  name: shortText,
  category: shortText,
  categoryId: z.string().max(191).optional(),
  createdAt: z.iso.datetime().optional(),
  price: z.number().finite().nonnegative(),
  oldPrice: z.number().finite().nonnegative().optional(),
  paymentPrices: z.array(z.object({ label: z.string().trim().min(1).max(80), price: z.number().finite().nonnegative() })).max(20).optional(),
  tag: shortText.optional(),
  image,
  section: z.enum(["nuevo", "sale"]),
});
const category = z.object({ id: z.string().min(1).max(191).optional(), name: z.string().trim().min(1).max(100), img: image.optional() });
const instagramPost = z.object({
  id: z.string().min(1).max(191),
  url: z.string().max(4000),
  image,
  title: shortText,
  kind: z.enum(["post", "reel"]),
});
const whatsapp = z.string().trim().max(30).refine((value) => !value || normalizeWhatsAppNumber(value) !== null);

export const contentSchemas: Record<ContentKey, ZodType> = {
  promo: z.array(shortText).max(100),
  hero: z.array(slide).max(30),
  products: z.array(product).max(500),
  categories: z.array(category).max(100),
  instagram: z.array(instagramPost).max(100),
  contact: z.object({ whatsapp }).partial().passthrough(),
  texts: z.object({
    offers,
    homeSections: homeSections.optional(),
    benefits: z.array(z.object({ t: shortText, d: shortText })).max(30).optional(),
    categories: z.array(category).max(100).optional(),
    split: z.object({ kicker: shortText, big: shortText, sub: shortText, cta: shortText, img: image }).partial().passthrough().optional(),
    club: z.object({ kicker: shortText, big: shortText, text: shortText, code: shortText, cta: shortText }).partial().passthrough().optional(),
    marquee: z.array(shortText).max(100).optional(),
    editorial: z.object({ kicker: shortText, title: shortText, text: shortText, cta: shortText, img: image }).partial().passthrough().optional(),
  }).partial().passthrough(),
};
