import "server-only";

import { randomBytes } from "node:crypto";
import { z } from "zod";
import type { InstagramPost } from "@/lib/content";
import { instagramMediaAsset, type InstagramMediaAsset } from "@/lib/instagram-media";
import { instagramPermalink, instagramProfileUrl } from "@/lib/storefront-rules";
import { decryptInstagramToken, encryptInstagramToken, type StoredInstagramToken } from "@/server/instagram-crypto";
import { prisma } from "@/server/prisma";

const api = "https://graph.instagram.com/v25.0";
const refreshSeconds = 15 * 60;
const tokenKey = "__instagram_access_token";
const feedKey = "__instagram_feed_cache";
const mediaCacheKey = "__instagram_media_cache";
const day = 24 * 60 * 60 * 1000;

const storedTokenSchema = z.object({
  version: z.literal(2),
  connectionId: z.string(),
  token: z.string(),
  iv: z.string(),
  tag: z.string(),
  nextRefreshAt: z.number(),
  accountId: z.string().optional(),
  username: z.string().optional(),
});

const feedCacheSchema = z.object({
  connectionId: z.string(),
  fetchedAt: z.number(),
  posts: z.array(z.object({
    id: z.string(),
    url: z.string(),
    image: z.string(),
    title: z.string(),
    kind: z.enum(["post", "reel"]),
  })).max(6),
});

const mediaCacheSchema = z.object({
  connectionId: z.string(),
  fetchedAt: z.number(),
  checkedUrls: z.array(z.string()),
  mediaIds: z.record(z.string(), z.string()),
  assets: z.record(z.string(), z.object({
    videoUrl: z.string().optional(),
    imageUrl: z.string().optional(),
    posterUrl: z.string().optional(),
  })),
});

type InstagramMedia = {
  id?: unknown;
  permalink?: unknown;
  timestamp?: unknown;
};

function encryptionSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) throw new Error("Configurá AUTH_SECRET para guardar el token de Instagram.");
  return secret;
}

type InstagramConnection = { token: string; connectionId: string; nextRefreshAt: number; updatedAt: Date; accountId?: string; username?: string };

async function storedConnection(): Promise<InstagramConnection | null> {
  const row = await prisma.siteContent.findUnique({ where: { key: tokenKey }, select: { data: true, updatedAt: true } });
  const saved = storedTokenSchema.safeParse(row?.data);
  if (!saved.success) return null;
  const token = decryptInstagramToken(saved.data as StoredInstagramToken, encryptionSecret());
  return token && row ? { token, connectionId: saved.data.connectionId, nextRefreshAt: saved.data.nextRefreshAt, updatedAt: row.updatedAt, accountId: saved.data.accountId, username: saved.data.username } : null;
}

export async function hasInstagramConnection() {
  return (await storedConnection()) !== null;
}

async function accessToken(connection: InstagramConnection): Promise<string> {
  const { token, connectionId } = connection;
  if (Date.now() < connection.nextRefreshAt) return token;

  let refreshed = token;
  let nextRefreshAt = Date.now() + day;
  try {
    const url = new URL("https://graph.instagram.com/refresh_access_token");
    url.searchParams.set("grant_type", "ig_refresh_token");
    url.searchParams.set("access_token", token);
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error("No se pudo renovar el token de Instagram.");
    const result = await response.json() as { access_token?: unknown };
    if (typeof result.access_token !== "string" || !result.access_token) throw new Error("Meta devolvió un token inválido.");
    refreshed = result.access_token;
    nextRefreshAt = Date.now() + 30 * day;
  } catch {
    console.error("No se pudo renovar el token de Instagram; se volverá a intentar mañana.");
  }

  const data = encryptInstagramToken(refreshed, connectionId, nextRefreshAt, encryptionSecret(), { accountId: connection.accountId, username: connection.username });
  await prisma.siteContent.updateMany({
    where: { key: tokenKey, updatedAt: connection.updatedAt },
    data: { data },
  }).catch(() => console.error("No se pudo guardar el token renovado de Instagram."));

  return refreshed;
}

async function getInstagram<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${api}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`Instagram respondió con HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

export class InstagramConnectionError extends Error {}

type InstagramProfile = { id: string; username: string };

async function readInstagramProfile(connection: InstagramConnection): Promise<InstagramProfile | null> {
  const token = await accessToken(connection);
  const profile = await getInstagram<{ id?: unknown; username?: unknown }>("/me?fields=id,username", token);
  if (typeof profile.id !== "string" || !profile.id || typeof profile.username !== "string" || !instagramProfileUrl(profile.username)) return null;
  if (connection.accountId && connection.accountId !== profile.id) return null;
  return { id: profile.id, username: profile.username };
}

export async function loadInstagramProfile(): Promise<InstagramProfile | null> {
  const connection = await storedConnection().catch(() => null);
  if (!connection) return null;
  try {
    return await readInstagramProfile(connection);
  } catch {
    return null;
  }
}

export async function instagramConnectionStatus() {
  const connection = await storedConnection();
  if (!connection) return { saved: false, username: null };
  const profile = await readInstagramProfile(connection).catch(() => null);
  return { saved: true, username: profile?.username ?? connection.username ?? null };
}

export async function isInstagramEmbedUnavailable(value: string): Promise<boolean> {
  const permalink = instagramPermalink(value);
  if (!permalink) return true;

  try {
    const url = new URL("https://graph.facebook.com/v25.0/instagram_oembed");
    url.searchParams.set("url", permalink);
    const response = await fetch(url, { next: { revalidate: 900 }, signal: AbortSignal.timeout(5000) });
    if (response.ok) return false;
    const result = await response.json() as { error?: { error_subcode?: unknown } };
    return result.error?.error_subcode === 2207045;
  } catch {
    return false;
  }
}

export async function loadInstagramMediaAssets(posts: InstagramPost[]): Promise<Record<string, InstagramMediaAsset>> {
  const urls = [...new Set(posts.map((post) => instagramPermalink(post.url)).filter((url): url is string => url !== null))];
  if (!urls.length) return {};
  const connection = await storedConnection().catch(() => null);
  if (!connection) return {};

  const row = await prisma.siteContent.findUnique({ where: { key: mediaCacheKey }, select: { data: true } }).catch(() => null);
  const parsed = mediaCacheSchema.safeParse(row?.data);
  const cache = parsed.success && parsed.data.connectionId === connection.connectionId ? parsed.data : null;
  if (cache && Date.now() - cache.fetchedAt < refreshSeconds * 1000 && urls.every((url) => cache.checkedUrls.includes(url))) {
    return Object.fromEntries(urls.flatMap((url) => cache.assets[url] ? [[url, cache.assets[url]]] : []));
  }

  try {
    const token = await accessToken(connection);
    const mediaIds = { ...(cache?.mediaIds ?? {}) };
    const missing = new Set(urls.filter((url) => !mediaIds[url] && (!cache || Date.now() - cache.fetchedAt >= day || !cache.checkedUrls.includes(url))));
    let after: string | undefined;
    const scanDeadline = Date.now() + 10_000;
    for (let page = 0; page < 30 && missing.size && Date.now() < scanDeadline; page += 1) {
      const path = new URL("/me/media", api);
      path.searchParams.set("fields", "id,permalink");
      path.searchParams.set("limit", "100");
      if (after) path.searchParams.set("after", after);
      const feed = await getInstagram<{ data?: { id?: unknown; permalink?: unknown }[]; paging?: { cursors?: { after?: unknown } } }>(`${path.pathname}${path.search}`, token);
      for (const item of Array.isArray(feed.data) ? feed.data : []) {
        if (typeof item.id !== "string" || typeof item.permalink !== "string") continue;
        const url = instagramPermalink(item.permalink);
        if (url) {
          for (const requestedUrl of missing) {
            if (requestedUrl.split("/")[4] !== url.split("/")[4]) continue;
            mediaIds[requestedUrl] = item.id;
            missing.delete(requestedUrl);
          }
        }
      }
      const cursor = feed.paging?.cursors?.after;
      if (typeof cursor !== "string" || !cursor || cursor === after) break;
      after = cursor;
    }

    const assets: Record<string, InstagramMediaAsset> = {};
    await Promise.all(urls.map(async (url) => {
      const id = mediaIds[url];
      if (!id) return;
      try {
        const media = await getInstagram<{ media_type?: unknown; media_url?: unknown; thumbnail_url?: unknown }>(
          `/${encodeURIComponent(id)}?fields=media_type,media_url,thumbnail_url`, token,
        );
        const completeMedia = media.media_type === "CAROUSEL_ALBUM"
          ? await getInstagram<unknown>(`/${encodeURIComponent(id)}?fields=media_type,children{media_type,media_url,thumbnail_url}`, token)
          : media;
        const asset = instagramMediaAsset(completeMedia);
        if (asset) assets[url] = asset;
      } catch {
        // Una publicación sin archivo accesible conserva su enlace a Instagram.
      }
    }));

    const data = { connectionId: connection.connectionId, fetchedAt: Date.now(), checkedUrls: urls, mediaIds, assets };
    await prisma.siteContent.upsert({
      where: { key: mediaCacheKey },
      create: { key: mediaCacheKey, data },
      update: { data },
    }).catch(() => console.error("No se pudo guardar la caché de videos de Instagram."));
    return assets;
  } catch (error) {
    console.error("No se pudieron cargar los videos de Instagram.", error);
    return cache && Date.now() - cache.fetchedAt < 2 * 60 * 60 * 1000
      ? Object.fromEntries(urls.flatMap((url) => cache.assets[url] ? [[url, cache.assets[url]]] : []))
      : {};
  }
}

export async function saveInstagramConnection(token: string) {
  let profile: { id?: unknown; username?: unknown };
  let feed: { data?: unknown };
  try {
    [profile, feed] = await Promise.all([
      getInstagram<{ id?: unknown; username?: unknown }>("/me?fields=id,username", token),
      getInstagram<{ data?: unknown }>("/me/media?fields=id,permalink,timestamp&limit=1", token),
    ]);
  } catch {
    throw new InstagramConnectionError("Meta rechazó el token o no permitió leer las publicaciones.");
  }
  if (typeof profile.id !== "string" || !profile.id || typeof profile.username !== "string" || !instagramProfileUrl(profile.username)) {
    throw new InstagramConnectionError("Meta no devolvió una cuenta de Instagram válida.");
  }
  if (!Array.isArray(feed.data)) {
    throw new InstagramConnectionError("Meta no devolvió una lista de publicaciones válida.");
  }

  const data = encryptInstagramToken(token, randomBytes(16).toString("hex"), Date.now() + day, encryptionSecret(), { accountId: profile.id, username: profile.username });
  await prisma.$transaction([
    prisma.siteContent.upsert({
      where: { key: tokenKey },
      create: { key: tokenKey, data },
      update: { data },
    }),
    prisma.siteContent.deleteMany({ where: { key: { in: [feedKey, mediaCacheKey] } } }),
  ]);
  return { id: profile.id, username: profile.username };
}

export async function loadRecentInstagramPosts(): Promise<InstagramPost[] | null> {
  const connection = await storedConnection().catch(() => {
    console.error("No se pudo consultar la conexión de Instagram.");
    return null;
  });
  if (!connection) return null;

  const row = await prisma.siteContent.findUnique({ where: { key: feedKey }, select: { data: true } }).catch(() => null);
  const parsedCache = feedCacheSchema.safeParse(row?.data);
  const cache = parsedCache.success && parsedCache.data.connectionId === connection.connectionId
    ? parsedCache.data
    : null;
  if (cache && Date.now() - cache.fetchedAt < refreshSeconds * 1000) return cache.posts;
  const fallback = cache && Date.now() - cache.fetchedAt < day ? cache.posts : null;

  try {
    const token = await accessToken(connection);
    const profile = await getInstagram<{ id?: unknown }>("/me?fields=id", token);
    if (connection.accountId && profile.id !== connection.accountId) {
      console.error("El token de Instagram no pertenece a la cuenta vinculada.");
      return fallback;
    }

    const feed = await getInstagram<{ data?: InstagramMedia[] }>(
      "/me/media?fields=id,permalink,timestamp&limit=12",
      token,
    );

    const posts = (Array.isArray(feed.data) ? feed.data : [])
      .filter((item) => typeof item.id === "string" && typeof item.permalink === "string")
      .sort((a, b) => String(b.timestamp ?? "").localeCompare(String(a.timestamp ?? "")))
      .flatMap((item) => {
        const url = instagramPermalink(item.permalink as string);
        return url ? [{
          id: item.id as string,
          url,
          image: "",
          title: "",
          kind: url.includes("/reel/") ? "reel" as const : "post" as const,
        }] : [];
      })
      .slice(0, 6);

    const data = { connectionId: connection.connectionId, fetchedAt: Date.now(), posts };
    await prisma.siteContent.upsert({
      where: { key: feedKey },
      create: { key: feedKey, data },
      update: { data },
    }).catch(() => console.error("No se pudo guardar la lista reciente de Instagram."));
    return posts;
  } catch (error) {
    console.error("No se pudieron cargar las publicaciones de Instagram.", error);
    return fallback;
  }
}
