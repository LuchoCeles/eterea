import "server-only";

import { randomBytes } from "node:crypto";
import { z } from "zod";
import type { InstagramPost } from "@/lib/content";
import { instagramPermalink } from "@/lib/storefront-rules";
import { decryptInstagramToken, encryptInstagramToken, type StoredInstagramToken } from "@/server/instagram-crypto";
import { prisma } from "@/server/prisma";

const account = "eterea.newconcept";
const api = "https://graph.instagram.com/v25.0";
const refreshSeconds = 15 * 60;
const tokenKey = "__instagram_access_token";
const feedKey = "__instagram_feed_cache";
const day = 24 * 60 * 60 * 1000;

const storedTokenSchema = z.object({
  version: z.literal(2),
  connectionId: z.string(),
  token: z.string(),
  iv: z.string(),
  tag: z.string(),
  nextRefreshAt: z.number(),
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

type InstagramConnection = { token: string; connectionId: string; nextRefreshAt: number; updatedAt: Date };

async function storedConnection(): Promise<InstagramConnection | null> {
  const row = await prisma.siteContent.findUnique({ where: { key: tokenKey }, select: { data: true, updatedAt: true } });
  const saved = storedTokenSchema.safeParse(row?.data);
  if (!saved.success) return null;
  const token = decryptInstagramToken(saved.data as StoredInstagramToken, encryptionSecret());
  return token && row ? { token, connectionId: saved.data.connectionId, nextRefreshAt: saved.data.nextRefreshAt, updatedAt: row.updatedAt } : null;
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

  const data = encryptInstagramToken(refreshed, connectionId, nextRefreshAt, encryptionSecret());
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

export async function saveInstagramConnection(token: string) {
  let profile: { username?: unknown };
  let feed: { data?: unknown };
  try {
    [profile, feed] = await Promise.all([
      getInstagram<{ username?: unknown }>("/me?fields=username", token),
      getInstagram<{ data?: unknown }>("/me/media?fields=id,permalink,timestamp&limit=1", token),
    ]);
  } catch {
    throw new InstagramConnectionError("Meta rechazó el token o no permitió leer las publicaciones.");
  }
  if (typeof profile.username !== "string" || profile.username.toLowerCase() !== account) {
    throw new InstagramConnectionError("El token debe pertenecer a @eterea.newconcept.");
  }
  if (!Array.isArray(feed.data)) {
    throw new InstagramConnectionError("Meta no devolvió una lista de publicaciones válida.");
  }

  const data = encryptInstagramToken(token, randomBytes(16).toString("hex"), Date.now() + day, encryptionSecret());
  await prisma.$transaction([
    prisma.siteContent.upsert({
      where: { key: tokenKey },
      create: { key: tokenKey, data },
      update: { data },
    }),
    prisma.siteContent.deleteMany({ where: { key: feedKey } }),
  ]);
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
    const profile = await getInstagram<{ username?: unknown }>("/me?fields=username", token);
    if (typeof profile.username !== "string" || profile.username.toLowerCase() !== account) {
      console.error("El token de Instagram no pertenece a @eterea.newconcept.");
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
