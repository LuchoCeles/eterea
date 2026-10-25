import "server-only";
import type { InstagramPost } from "@/lib/content";
import type { InstagramMediaAsset } from "@/lib/instagram-media";
import type { StoredInstagramToken } from "@/server/instagram-crypto";
import { prisma } from "@/server/prisma";

export async function readStoredConnection() {
  const row = await prisma.instagramConnection.findUnique({ where: { id: 1 } });
  if (!row) return null;
  const data: StoredInstagramToken = {
    version: 2, connectionId: row.connectionId, token: row.encryptedToken,
    iv: row.iv, tag: row.tag, nextRefreshAt: row.nextRefreshAt.getTime(),
    ...(row.accountId ? { accountId: row.accountId } : {}),
    ...(row.username ? { username: row.username } : {}),
  };
  return { data, updatedAt: row.updatedAt };
}

function connectionColumns(data: StoredInstagramToken) {
  return {
    connectionId: data.connectionId, encryptedToken: data.token, iv: data.iv,
    tag: data.tag, nextRefreshAt: new Date(data.nextRefreshAt),
    accountId: data.accountId ?? null, username: data.username ?? null,
  };
}

export async function updateStoredConnection(data: StoredInstagramToken, updatedAt: Date) {
  return prisma.instagramConnection.updateMany({
    where: { id: 1, updatedAt }, data: connectionColumns(data),
  });
}

export async function replaceStoredConnection(data: StoredInstagramToken) {
  await prisma.$transaction(async (db) => {
    const columns = connectionColumns(data);
    await db.instagramConnection.upsert({ where: { id: 1 }, create: { id: 1, ...columns }, update: columns });
    await db.instagramFeedState.deleteMany();
    await db.instagramFeedPost.deleteMany();
    await db.instagramMediaState.deleteMany();
    await db.instagramMediaEntry.deleteMany();
  });
}

export async function readFeedCache(connectionId: string) {
  const [state, rows] = await Promise.all([
    prisma.instagramFeedState.findUnique({ where: { id: 1 } }),
    prisma.instagramFeedPost.findMany({ orderBy: [{ position: "asc" }, { id: "asc" }] }),
  ]);
  if (!state || state.connectionId !== connectionId) return null;
  const posts: InstagramPost[] = rows.map((row) => ({
    id: row.id, url: row.url, image: row.image, title: row.title, kind: row.kind as "post" | "reel",
  }));
  return { connectionId, fetchedAt: state.fetchedAt.getTime(), posts };
}

export async function writeFeedCache(connectionId: string, fetchedAt: number, posts: InstagramPost[]) {
  await prisma.$transaction(async (db) => {
    await db.instagramFeedPost.deleteMany();
    await db.instagramFeedPost.createMany({ data: posts.map((post, position) => ({
      id: post.id, position, url: post.url, image: post.image, title: post.title, kind: post.kind,
    })) });
    await db.instagramFeedState.upsert({ where: { id: 1 },
      create: { id: 1, connectionId, fetchedAt: new Date(fetchedAt) },
      update: { connectionId, fetchedAt: new Date(fetchedAt) },
    });
  });
}

export async function readMediaCache(connectionId: string) {
  const [state, rows] = await Promise.all([
    prisma.instagramMediaState.findUnique({ where: { id: 1 } }),
    prisma.instagramMediaEntry.findMany(),
  ]);
  if (!state || state.connectionId !== connectionId) return null;
  const mediaIds: Record<string, string> = {};
  const assets: Record<string, InstagramMediaAsset> = {};
  for (const row of rows) {
    if (row.mediaId) mediaIds[row.url] = row.mediaId;
    if (row.videoUrl || row.imageUrl || row.posterUrl) {
      assets[row.url] = {
        ...(row.videoUrl ? { videoUrl: row.videoUrl } : {}),
        ...(row.imageUrl ? { imageUrl: row.imageUrl } : {}),
        ...(row.posterUrl ? { posterUrl: row.posterUrl } : {}),
      };
    }
  }
  return { connectionId, fetchedAt: state.fetchedAt.getTime(), checkedUrls: rows.filter((row) => row.checked).map((row) => row.url), mediaIds, assets };
}

export async function writeMediaCache(connectionId: string, fetchedAt: number, urls: string[],
  mediaIds: Record<string, string>, assets: Record<string, InstagramMediaAsset>) {
  await prisma.$transaction(async (db) => {
    await db.instagramMediaEntry.deleteMany();
    const checked = new Set(urls);
    const allUrls = [...new Set([...urls, ...Object.keys(mediaIds), ...Object.keys(assets)])];
    await db.instagramMediaEntry.createMany({ data: allUrls.map((url) => ({
      url, checked: checked.has(url), mediaId: mediaIds[url] ?? null, videoUrl: assets[url]?.videoUrl ?? null,
      imageUrl: assets[url]?.imageUrl ?? null, posterUrl: assets[url]?.posterUrl ?? null,
    })) });
    await db.instagramMediaState.upsert({ where: { id: 1 },
      create: { id: 1, connectionId, fetchedAt: new Date(fetchedAt) },
      update: { connectionId, fetchedAt: new Date(fetchedAt) },
    });
  });
}
