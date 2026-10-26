import { z, type ZodType } from "zod";
import type { ContentKey, TextSectionKey } from "@/lib/content";
import { instagramProfileUrl, normalizeWhatsAppNumber } from "@/lib/storefront-rules";

const shortText = z.string().max(4000);
const image = z.string().max(4000);
const productImages = z.array(image.trim().min(1)).max(5)
  .refine((items) => new Set(items).size === items.length);
const productOptions = z.array(z.string().trim().min(1).max(80)).max(30)
  .refine((items) => new Set(items.map((item) => item.toLocaleLowerCase("es-AR"))).size === items.length);
const productId = z.string().min(1).max(191).optional();
const offers = z.object({ enabled: z.boolean(), showSplit: z.boolean(), showClub: z.boolean() }).partial().strict();
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
}).partial().strict();
const slide = z.object({
  img: image,
  productId,
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
  hidden: z.boolean().optional(),
  createdAt: z.iso.datetime().optional(),
  price: z.number().finite().nonnegative(),
  oldPrice: z.number().finite().nonnegative().optional(),
  paymentPrices: z.array(z.object({ label: z.string().trim().min(1).max(80), price: z.number().finite().nonnegative() })).max(20).optional(),
  tag: shortText.optional(),
  image,
  images: productImages.optional(),
  description: shortText.optional(),
  sizes: productOptions.optional(),
  colors: productOptions.optional(),
  section: z.enum(["nuevo", "sale"]),
});
const category = z.object({ id: z.string().min(1).max(191).optional(), name: z.string().trim().min(1).max(100), hidden: z.boolean().optional() });
const homeCategoryCard = z.object({ id: z.string().min(1).max(191), categoryId: z.string().min(1).max(191), img: image, productId, hidden: z.boolean().optional() });
const instagramPost = z.object({
  id: z.string().min(1).max(191),
  url: z.string().max(4000),
  image,
  productId,
  title: shortText,
  kind: z.enum(["post", "reel"]),
});
const whatsapp = z.string().trim().max(30).refine((value) => !value || normalizeWhatsAppNumber(value) !== null);
const instagramUsername = z.string().trim().max(31).refine((value) => !value || instagramProfileUrl(value) !== null);

const textSectionsSchema = z.object({
  homeSections,
  benefits: z.array(z.object({ t: shortText, d: shortText })).max(30),
  homeCategoryCards: z.array(homeCategoryCard).max(100),
  split: z.object({ kicker: shortText, big: shortText, sub: shortText, cta: shortText, img: image, productId }).partial().strict(),
  club: z.object({ kicker: shortText, big: shortText, text: shortText, code: shortText, cta: shortText }).partial().strict(),
  marquee: z.array(shortText).max(100),
  editorial: z.object({ kicker: shortText, title: shortText, text: shortText, cta: shortText, img: image, productId }).partial().strict(),
});

export const contentSchemas: Record<ContentKey, ZodType> = {
  promo: z.array(shortText).max(100),
  hero: z.array(slide).max(30),
  products: z.array(product).max(500),
  categories: z.array(category).max(100),
  instagram: z.array(instagramPost).max(100),
  contact: z.object({ whatsapp, instagramUsername }).partial().strict(),
  texts: textSectionsSchema.extend({
    offers,
    categories: z.array(category).max(100).optional(),
  }).partial().strict(),
};

export const textSectionKeys: TextSectionKey[] = ["homeSections", "homeCategoryCards", "benefits", "split", "club", "marquee", "editorial"];
export const textSectionSchemas: Record<TextSectionKey, ZodType> = textSectionsSchema.shape;
