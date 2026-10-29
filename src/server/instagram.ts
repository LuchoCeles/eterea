import "server-only";

import { randomBytes } from "node:crypto";
import { after as afterResponse } from "next/server";
import type { InstagramPost } from "@/lib/content";
import { instagramMediaAsset, type InstagramMediaAsset } from "@/lib/instagram-media";
import { instagramPermalink, instagramProfileUrl, recentInstagramPosts } from "@/lib/storefront-rules";
import { decryptInstagramToken, encryptInstagramToken } from "@/server/instagram-crypto";
import { getInstagram, instagramAccountPath, instagramGraphApi, InstagramMetaError, validateInstagramAccount } from "@/server/instagram-meta";
import { readFeedCache, readMediaCache, readStoredConnection, readStoredInstagramConnectionInfo, replaceStoredConnection, writeFeedCache, writeMediaCache } from "@/server/instagram-storage";

const refreshSeconds = 15 * 60;
const day = 24 * 60 * 60 * 1000;
const pendingRefreshes = new Map<string, Promise<unknown>>();
const recentMediaAssets = new Map<string, { fetchedAt: number; assets: Record<string, InstagramMediaAsset> }>();

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

type InstagramConnection = { token: string; connectionId: string; updatedAt: Date; accountId?: string; username?: string };

async function storedConnection(): Promise<InstagramConnection | null> {
  const row = await readStoredConnection();
  if (!row) return null;
  const token = decryptInstagramToken(row.data, encryptionSecret());
  return token ? { token, connectionId: row.data.connectionId,
    updatedAt: row.updatedAt, accountId: row.data.accountId, username: row.data.username } : null;
}

export async function hasInstagramConnection() {
  return (await storedConnection()) !== null;
}

export class InstagramConnectionError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

type InstagramProfile = { id: string; username: string };

async function readInstagramProfile(connection: InstagramConnection): Promise<InstagramProfile | null> {
  if (!connection.accountId) return null;
  const profile = await getInstagram<{ id?: unknown; username?: unknown }>(
    `${instagramAccountPath(connection.accountId)}?fields=id,username`, connection.token,
  );
  if (typeof profile.id !== "string" || !profile.id || typeof profile.username !== "string" || !instagramProfileUrl(profile.username)) return null;
  if (connection.accountId !== profile.id) return null;
  return { id: profile.id, username: profile.username };
}

export async function loadInstagramConnectionInfo() {
  const { connected, username } = await readStoredInstagramConnectionInfo();
  return { connected, username: username && instagramProfileUrl(username) ? username : null };
}

export async function instagramConnectionStatus() {
  const connection = await storedConnection();
  if (!connection) return { saved: false, username: null, accountId: null };
  const profile = await readInstagramProfile(connection).catch(() => null);
  return { saved: true, username: profile?.username ?? connection.username ?? null, accountId: connection.accountId ?? null };
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
  if (!connection || !connection.accountId) return {};

  const key = `media:${connection.connectionId}:${[...urls].sort().join("|")}`;
  const memoryCache = recentMediaAssets.get(key);
  if (memoryCache && Date.now() - memoryCache.fetchedAt < refreshSeconds * 1000) return memoryCache.assets;

  const cache = await readMediaCache(connection.connectionId).catch(() => null);
  return refreshOnce(key, async () => {
    const assets = await refreshInstagramMediaAssets(urls, connection, cache, knownMediaIds);
    if (!assets) return {};
    const fetchedAt = Date.now();
    for (const [cacheKey, value] of recentMediaAssets) {
      if (fetchedAt - value.fetchedAt >= refreshSeconds * 1000) recentMediaAssets.delete(cacheKey);
    }
    recentMediaAssets.set(key, { fetchedAt, assets });
    return assets;
  });
}

type MediaCache = Awaited<ReturnType<typeof readMediaCache>>;

async function refreshInstagramMediaAssets(urls: string[], connection: InstagramConnection, cache: MediaCache, knownMediaIds: Record<string, string>): Promise<Record<string, InstagramMediaAsset> | null> {
  try {
    const { token, accountId } = connection;
    if (!accountId) return null;
    const mediaIds = { ...(cache?.mediaIds ?? {}), ...knownMediaIds };
    const missing = new Set(urls.filter((url) => !mediaIds[url] && (!cache || Date.now() - cache.fetchedAt >= day || !cache.checkedUrls.includes(url))));
    let after: string | undefined;
    const scanDeadline = Date.now() + 10_000;
    for (let page = 0; page < 30 && missing.size && Date.now() < scanDeadline; page += 1) {
      const path = new URL(instagramAccountPath(accountId, "/media"), instagramGraphApi());
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

    // Las URLs firmadas de Meta son temporales: solo persistimos IDs estables y refrescamos las portadas en memoria.
    await writeMediaCache(connection.connectionId, Date.now(), urls, mediaIds, {})
      .catch(() => console.error("No se pudo guardar la caché de imágenes de Instagram."));
    return assets;
  } catch {
    console.error("No se pudieron cargar las imágenes de Instagram.");
    return null;
  }
}

export async function validateInstagramConnection(token: string, accountId: string) {
  try {
    const profile = await validateInstagramAccount(token, accountId);
    if (!instagramProfileUrl(profile.username)) throw new InstagramConnectionError("Meta no devolvió un usuario de Instagram válido.");
    return profile;
  } catch (error) {
    if (error instanceof InstagramMetaError) throw new InstagramConnectionError(error.message, error.status);
    throw error;
  }
}

export async function saveInstagramConnection(token: string, accountId: string, confirmedUsername: string) {
  const profile = await validateInstagramConnection(token, accountId);
  if (confirmedUsername.replace(/^@/, "").trim().toLowerCase() !== profile.username.toLowerCase()) {
    throw new InstagramConnectionError("La cuenta identificada cambió. Volvé a validar y confirmá el usuario que muestra Meta.");
  }

  // nextRefreshAt queda por compatibilidad con el esquema; Unified Login no renueva el SUAT desde Instagram.
  const data = encryptInstagramToken(token, randomBytes(16).toString("hex"), Date.now() + day, encryptionSecret(), { accountId: profile.id, username: profile.username });
  await replaceStoredConnection(data);
  recentMediaAssets.clear();
  return profile;
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
    const { token, accountId } = connection;
    if (!accountId) throw new Error("La conexión no tiene ID de Instagram.");
    const profile = await getInstagram<{ id?: unknown; username?: unknown }>(
      `${instagramAccountPath(accountId)}?fields=id,username`, token,
    );
    if (profile.id !== accountId ||
      typeof profile.id !== "string" || !profile.id || typeof profile.username !== "string" || !instagramProfileUrl(profile.username)) {
      console.error("La cuenta conectada de Instagram cambió o devolvió datos no válidos.");
      return null;
    }

    const feed = await getInstagram<{ data?: unknown }>(
      `${instagramAccountPath(accountId, "/media")}?fields=id,permalink,timestamp&limit=12`,
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
