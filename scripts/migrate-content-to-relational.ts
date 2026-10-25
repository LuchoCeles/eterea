import "dotenv/config";
import { PrismaClient } from "@/generated/prisma/client";
import { defaults, resolveContent, type ContentKey } from "@/lib/content";
import { contentSchemas } from "@/lib/content-schema";
import { referencedProductIds } from "@/lib/image-source";
import { instagramPermalink } from "@/lib/storefront-rules";
import { createMariaDbAdapter } from "@/server/prisma-adapter";
import { loadRelationalContent, saveRelationalContent } from "@/server/relational-content";
import { z } from "zod";

const prisma = new PrismaClient({ adapter: createMariaDbAdapter() });
const keys = Object.keys(defaults) as ContentKey[];
const specialKeys = ["__catalog_relational_v1", "__cloudinary_cleanup", "__instagram_access_token", "__instagram_feed_cache", "__instagram_media_cache"];
const apply = process.argv.includes("--apply");

const tokenSchema = z.object({
  version: z.literal(2), connectionId: z.string().min(1), token: z.string().min(1),
  iv: z.string().min(1), tag: z.string().min(1), nextRefreshAt: z.number().finite(),
  accountId: z.string().optional(), username: z.string().optional(),
});
const cachedPost = z.object({ id: z.string(), url: z.string(), image: z.string(), title: z.string(), kind: z.enum(["post", "reel"]) });
const feedSchema = z.object({ connectionId: z.string(), fetchedAt: z.number(), posts: z.array(cachedPost) });
const mediaAsset = z.object({ videoUrl: z.string().optional(), imageUrl: z.string().optional(), posterUrl: z.string().optional() });
const mediaSchema = z.object({ connectionId: z.string(), fetchedAt: z.number(), checkedUrls: z.array(z.string()),
  mediaIds: z.record(z.string(), z.string()), assets: z.record(z.string(), mediaAsset) });

function decoded(value: unknown): unknown {
  if (Buffer.isBuffer(value)) return JSON.parse(value.toString("utf8")) as unknown;
  if (typeof value === "string") return JSON.parse(value) as unknown;
  return value;
}

function assertOnlyKeys(value: unknown, allowed: string[], path: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  const unknown = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unknown.length) throw new Error(`Hay campos heredados sin columna en ${path}: ${unknown.join(", ")}`);
}

try {
  const rows = await prisma.$queryRaw<{ key: string; data: unknown }[]>`SELECT \`key\`, data FROM SiteContent`;
  const legacy = new Map(rows.map((row) => [row.key, decoded(row.data)]));
  const unknown = rows.filter((row) => !keys.includes(row.key as ContentKey) && !specialKeys.includes(row.key));
  if (unknown.length) throw new Error(`Hay claves heredadas sin destino: ${unknown.map((row) => row.key).join(", ")}`);
  if (legacy.get("__catalog_relational_v1") !== true) {
    throw new Error("Primero migrá el catálogo con npm run db:migrate-catalog.");
  }

  const content = new Map<ContentKey, unknown>();
  for (const key of keys) {
    if (!legacy.has(key)) continue;
    const raw = legacy.get(key);
    if (key === "contact") assertOnlyKeys(raw, ["whatsapp", "instagramUsername"], "contact");
    if (key === "texts") {
      assertOnlyKeys(raw, ["offers", "homeSections", "benefits", "categories", "homeCategoryCards", "split", "club", "marquee", "editorial"], "texts");
      const texts = raw as Record<string, unknown>;
      assertOnlyKeys(texts.offers, ["enabled", "showSplit", "showClub"], "texts.offers");
      assertOnlyKeys(texts.homeSections, Object.keys(defaults.texts.homeSections), "texts.homeSections");
      assertOnlyKeys(texts.split, ["kicker", "big", "sub", "cta", "img", "productId"], "texts.split");
      assertOnlyKeys(texts.club, ["kicker", "big", "text", "code", "cta"], "texts.club");
      assertOnlyKeys(texts.editorial, ["kicker", "title", "text", "cta", "img", "productId"], "texts.editorial");
    }
    if (key === "hero" && Array.isArray(raw)) raw.forEach((item, index) => assertOnlyKeys(item,
      ["img", "productId", "kicker", "title", "cta", "promo", "align"], `hero[${index}]`));
    if (key === "instagram" && Array.isArray(raw)) raw.forEach((item, index) => assertOnlyKeys(item,
      ["id", "url", "image", "productId", "title", "kind"], `instagram[${index}]`));
    const parsed = contentSchemas[key].safeParse(raw);
    if (!parsed.success) throw new Error(`El contenido heredado de «${key}» no es válido: ${parsed.error.message}`);
    content.set(key, resolveContent(key, parsed.data));
  }
  const token = legacy.has("__instagram_access_token") ? tokenSchema.parse(legacy.get("__instagram_access_token")) : null;
  const feed = legacy.has("__instagram_feed_cache") ? feedSchema.parse(legacy.get("__instagram_feed_cache")) : null;
  const media = legacy.has("__instagram_media_cache") ? mediaSchema.parse(legacy.get("__instagram_media_cache")) : null;
  const cleanup = legacy.has("__cloudinary_cleanup") ? z.array(z.string()).parse(legacy.get("__cloudinary_cleanup")) : [];
  if (feed && new Set(feed.posts.map((post) => post.id)).size !== feed.posts.length) throw new Error("La caché de publicaciones tiene identificadores repetidos.");
  if (media && new Set(media.checkedUrls).size !== media.checkedUrls.length) throw new Error("La caché multimedia tiene enlaces repetidos.");
  if (feed && token && feed.connectionId !== token.connectionId) throw new Error("La caché de publicaciones pertenece a otra conexión de Instagram.");
  if (media && token && media.connectionId !== token.connectionId) throw new Error("La caché multimedia pertenece a otra conexión de Instagram.");
  const productIds = new Set((await prisma.product.findMany({ select: { id: true } })).map((product) => product.id));
  const texts = content.get("texts") as typeof defaults.texts | undefined;
  const imageSources = [content.get("hero"), content.get("instagram"), texts?.split, texts?.editorial];
  if (referencedProductIds(imageSources).some((id) => !productIds.has(id))) {
    throw new Error("Hay banners o publicaciones que referencian productos inexistentes.");
  }
  const curated = content.get("instagram") as typeof defaults.instagram | undefined;
  if (curated?.some((post) => !instagramPermalink(post.url))) {
    throw new Error("Hay publicaciones heredadas con enlaces de Instagram inválidos.");
  }
  if (curated && new Set(curated.map((post) => post.id)).size !== curated.length) {
    throw new Error("Hay publicaciones heredadas con identificadores repetidos.");
  }

  const destinationCounts = await Promise.all([
    prisma.contentSection.count(), prisma.contactSettings.count(), prisma.offerSettings.count(),
    prisma.homeSectionSetting.count(), prisma.splitBanner.count(), prisma.clubBanner.count(),
    prisma.editorialBanner.count(), prisma.promoLine.count(), prisma.heroSlide.count(),
    prisma.benefit.count(), prisma.marqueeLine.count(), prisma.curatedInstagramPost.count(),
    prisma.instagramConnection.count(), prisma.instagramFeedState.count(), prisma.instagramFeedPost.count(),
    prisma.instagramMediaState.count(), prisma.instagramMediaEntry.count(), prisma.cloudinaryCleanup.count(),
  ]);
  if (destinationCounts.some(Boolean)) {
    throw new Error("Las tablas de destino ya contienen datos. Se detuvo la importación para no sobrescribirlos.");
  }
  console.info(`Auditoría: ${rows.length} claves heredadas; ${content.size} secciones de contenido; ${cleanup.length} imágenes en cola.`);
  if (!apply) {
    console.info("No se escribió en la base. Ejecutá npm run db:migrate-content -- --apply después de revisar el resultado.");
    process.exitCode = 0;
  } else {
    await prisma.$transaction(async (db) => {
      for (const key of ["promo", "hero", "instagram", "contact", "texts"] as ContentKey[]) {
        const value = content.get(key);
        if (value !== undefined) await saveRelationalContent(db, key, value as ReturnType<typeof resolveContent>);
      }
      for (const key of ["categories", "products", "homeCategoryCards"]) {
        await db.contentSection.create({ data: { key } });
      }
      if (token) {
        await db.instagramConnection.create({ data: {
          id: 1, connectionId: token.connectionId, encryptedToken: token.token,
          iv: token.iv, tag: token.tag, nextRefreshAt: new Date(token.nextRefreshAt),
          accountId: token.accountId ?? null, username: token.username ?? null,
        } });
      }
      if (feed) {
        await db.instagramFeedState.create({ data: { id: 1, connectionId: feed.connectionId, fetchedAt: new Date(feed.fetchedAt) } });
        await db.instagramFeedPost.createMany({ data: feed.posts.map((post, position) => ({ ...post, position })) });
      }
      if (media) {
        await db.instagramMediaState.create({ data: { id: 1, connectionId: media.connectionId, fetchedAt: new Date(media.fetchedAt) } });
        const checked = new Set(media.checkedUrls);
        const allUrls = [...new Set([...media.checkedUrls, ...Object.keys(media.mediaIds), ...Object.keys(media.assets)])];
        await db.instagramMediaEntry.createMany({ data: allUrls.map((url) => ({
          url, checked: checked.has(url), mediaId: media.mediaIds[url] ?? null, videoUrl: media.assets[url]?.videoUrl ?? null,
          imageUrl: media.assets[url]?.imageUrl ?? null, posterUrl: media.assets[url]?.posterUrl ?? null,
        })) });
      }
      if (cleanup.length) await db.cloudinaryCleanup.createMany({ data: [...new Set(cleanup)].map((url) => ({ url })) });
      const relational = await loadRelationalContent(db);
      for (const key of ["promo", "hero", "instagram", "contact"] as const) {
        if (!content.has(key)) continue;
        if (JSON.stringify(relational[key]) !== JSON.stringify(content.get(key))) {
          throw new Error(`La verificación de «${key}» falló; se revierte la importación.`);
        }
      }
      if (content.has("texts")) {
        const expected = content.get("texts") as typeof relational.texts;
        for (const section of ["offers", "homeSections", "benefits", "split", "club", "marquee", "editorial"] as const) {
          if (JSON.stringify(relational.texts[section]) !== JSON.stringify(expected[section])) {
            throw new Error(`La verificación de textos/${section} falló; se revierte la importación.`);
          }
        }
      }
      const counts = await Promise.all([
        db.instagramConnection.count(), db.instagramFeedPost.count(), db.instagramMediaEntry.count(), db.cloudinaryCleanup.count(),
      ]);
      if (counts[0] !== Number(!!token) || counts[1] !== (feed?.posts.length ?? 0)
        || counts[2] !== (media ? new Set([...media.checkedUrls, ...Object.keys(media.mediaIds), ...Object.keys(media.assets)]).size : 0)
        || counts[3] !== new Set(cleanup).size) {
        throw new Error("La verificación de los datos auxiliares falló; se revierte la importación.");
      }
    }, { timeout: 120_000 });
    console.info("Contenido importado y verificado. SiteContent se conserva hasta la finalización revisada de la migración.");
  }
} finally {
  await prisma.$disconnect();
}

