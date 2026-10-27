import "server-only";

import { randomBytes } from "node:crypto";
import { after as afterResponse } from "next/server";
import type { InstagramPost } from "@/lib/content";
import { instagramMediaAsset, type InstagramMediaAsset } from "@/lib/instagram-media";
import { instagramPermalink, instagramProfileUrl, recentInstagramPosts } from "@/lib/storefront-rules";
import { decryptInstagramToken, encryptInstagramToken } from "@/server/instagram-crypto";
import { readFeedCache, readMediaCache, readStoredConnection, readStoredInstagramConnectionInfo, replaceStoredConnection, updateStoredConnection, writeFeedCache, writeMediaCache } from "@/server/instagram-storage";

const api = "https://graph.instagram.com/v25.0";
const refreshSeconds = 15 * 60;
const day = 24 * 60 * 60 * 1000;
const pendingRefreshes = new Map<string, Promise<unknown>>();

function refreshOnce<T>(key: string, task: () => Promise<T>): Promise<T> {
  const pending = pendingRefreshes.get(key);
  if (pending) return pending as Promise<T>;
  const refresh = task().finally(() => pendingRefreshes.delete(key));
  pendingRefreshes.set(key, refresh);
  return refresh;
}

function refreshAfterResponse(key: string, task: () => Promise<unknown>) {
  afterResponse(() => {
    return refreshOnce(key, task).catch(() => {
      console.error("No se pudo renovar la caché de Instagram.");
    }).then(() => undefined);
  });
}

function encryptionSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) throw new Error("Configurá AUTH_SECRET para guardar el token de Instagram.");
  return secret;
}

type InstagramConnection = { token: string; connectionId: string; nextRefreshAt: number; updatedAt: Date; accountId?: string; username?: string };

async function storedConnection(): Promise<InstagramConnection | null> {
  const row = await readStoredConnection();
  if (!row) return null;
  const token = decryptInstagramToken(row.data, encryptionSecret());
  return token ? { token, connectionId: row.data.connectionId, nextRefreshAt: row.data.nextRefreshAt,
    updatedAt: row.updatedAt, accountId: row.data.accountId, username: row.data.username } : null;
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
  await updateStoredConnection(data, connection.updatedAt)
    .catch(() => console.error("No se pudo guardar el token renovado de Instagram."));

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

export async function loadInstagramConnectionInfo() {
  const { connected, username } = await readStoredInstagramConnectionInfo();
  return { connected, username: username && instagramProfileUrl(username) ? username : null };
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

export async function loadInstagramMediaAssets(posts: InstagramPost[], fromOwnFeed = false): Promise<Record<string, InstagramMediaAsset>> {
  const urls = [...new Set(posts.map((post) => instagramPermalink(post.url)).filter((url): url is string => url !== null))];
  if (!urls.length) return {};
  const knownMediaIds = fromOwnFeed ? Object.fromEntries(posts.flatMap((post) => {
    const url = instagramPermalink(post.url);
    return url ? [[url, post.id]] : [];
  })) : {};
  const connection = await storedConnection().catch(() => null);
  if (!connection) return {};

  const cache = await readMediaCache(connection.connectionId).catch(() => null);
  const checked = cache && urls.every((url) => cache.checkedUrls.includes(url));
  if (checked && Date.now() - cache.fetchedAt < refreshSeconds * 1000) {
    return cachedMediaAssets(urls, cache);
  }
  if (checked && Date.now() - cache.fetchedAt < 2 * 60 * 60 * 1000) {
    refreshAfterResponse(`media:${connection.connectionId}:${[...urls].sort().join("|")}`,
      () => refreshInstagramMediaAssets(urls, connection, cache, knownMediaIds));
    return cachedMediaAssets(urls, cache);
  }
  return refreshOnce(`media:${connection.connectionId}:${[...urls].sort().join("|")}`,
    () => refreshInstagramMediaAssets(urls, connection, cache, knownMediaIds));
}

type MediaCache = Awaited<ReturnType<typeof readMediaCache>>;

function cachedMediaAssets(urls: string[], cache: NonNullable<MediaCache>) {
  return Object.fromEntries(urls.flatMap((url) => cache.assets[url] ? [[url, cache.assets[url]]] : []));
}

async function refreshInstagramMediaAssets(urls: string[], connection: InstagramConnection, cache: MediaCache, knownMediaIds: Record<string, string>): Promise<Record<string, InstagramMediaAsset>> {
  try {
    const token = await accessToken(connection);
    const mediaIds = { ...(cache?.mediaIds ?? {}), ...knownMediaIds };
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

    await writeMediaCache(connection.connectionId, Date.now(), urls, mediaIds, assets)
      .catch(() => console.error("No se pudo guardar la caché de imágenes de Instagram."));
    return assets;
  } catch {
    console.error("No se pudieron cargar las imágenes de Instagram.");
    return cache && Date.now() - cache.fetchedAt < 2 * 60 * 60 * 1000
      ? cachedMediaAssets(urls, cache)
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
  if (profile.username.toLowerCase() !== "eterea.newconcept") {
    throw new InstagramConnectionError("El token debe corresponder a @eterea.newconcept.");
  }
  if (!Array.isArray(feed.data)) {
    throw new InstagramConnectionError("Meta no devolvió una lista de publicaciones válida.");
  }

  const data = encryptInstagramToken(token, randomBytes(16).toString("hex"), Date.now() + day, encryptionSecret(), { accountId: profile.id, username: profile.username });
  await replaceStoredConnection(data);
  return { id: profile.id, username: profile.username };
}

export async function loadRecentInstagramPosts(): Promise<InstagramPost[] | null> {
  const connection = await storedConnection().catch(() => {
    console.error("No se pudo consultar la conexión de Instagram.");
    return null;
  });
  if (!connection) return null;

  const cache = await readFeedCache(connection.connectionId).catch(() => null);
  if (cache && Date.now() - cache.fetchedAt < refreshSeconds * 1000) return cache.posts;
  const fallback = cache && Date.now() - cache.fetchedAt < day ? cache.posts : null;
  if (fallback) {
    refreshAfterResponse(`feed:${connection.connectionId}`, () => refreshRecentInstagramPosts(connection, fallback));
    return fallback;
  }
  return refreshOnce(`feed:${connection.connectionId}`, () => refreshRecentInstagramPosts(connection, fallback));
}

async function refreshRecentInstagramPosts(connection: InstagramConnection, fallback: InstagramPost[] | null) {
  try {
    const token = await accessToken(connection);
    const profile = await getInstagram<{ id?: unknown; username?: unknown }>("/me?fields=id,username", token);
    if ((connection.accountId && profile.id !== connection.accountId) ||
      typeof profile.username !== "string" || profile.username.toLowerCase() !== "eterea.newconcept") {
      console.error("La conexión de Instagram no corresponde a @eterea.newconcept.");
      return null;
    }

    const feed = await getInstagram<{ data?: unknown }>(
      "/me/media?fields=id,permalink,timestamp&limit=12",
      token,
    );
    if (!Array.isArray(feed.data)) throw new Error("Meta no devolvió una lista de publicaciones.");
    const posts = recentInstagramPosts(feed.data);

    await writeFeedCache(connection.connectionId, Date.now(), posts)
      .catch(() => console.error("No se pudo guardar la lista reciente de Instagram."));
    return posts;
  } catch {
    console.error("No se pudieron cargar las publicaciones de Instagram.");
    return fallback;
  }
}
