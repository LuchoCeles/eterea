export type InstagramMediaAsset = { videoUrl?: string; imageUrl?: string; posterUrl?: string };

type Media = {
  media_type?: unknown;
  media_url?: unknown;
  thumbnail_url?: unknown;
  children?: { data?: unknown };
};

function safeMediaUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const fromMeta = ["cdninstagram.com", "fbcdn.net"].some((domain) => host === domain || host.endsWith(`.${domain}`));
    return url.protocol === "https:" && fromMeta ? url.href : null;
  } catch {
    return null;
  }
}

export function instagramMediaAsset(value: unknown): InstagramMediaAsset | null {
  if (!value || typeof value !== "object") return null;
  const media = value as Media;
  if (media.media_type === "CAROUSEL_ALBUM" && Array.isArray(media.children?.data)) {
    const assets = media.children.data.map(instagramMediaAsset).filter((asset): asset is InstagramMediaAsset => asset !== null);
    return assets.find((asset) => asset.videoUrl) ?? assets[0] ?? null;
  }
  const url = safeMediaUrl(media.media_url);
  if (!url) return null;
  if (media.media_type === "VIDEO") {
    return { videoUrl: url, posterUrl: safeMediaUrl(media.thumbnail_url) ?? undefined };
  }
  return media.media_type === "IMAGE" ? { imageUrl: url } : null;
}
