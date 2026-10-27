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
    const cover = assets.find((asset) => asset.imageUrl || asset.posterUrl);
    const fallback = safeMediaUrl(media.media_url);
    return cover ?? (fallback ? { imageUrl: fallback } : null);
  }
  const url = safeMediaUrl(media.media_url);
  if (media.media_type === "VIDEO") {
    const posterUrl = safeMediaUrl(media.thumbnail_url);
    return url || posterUrl ? { ...(url ? { videoUrl: url } : {}), ...(posterUrl ? { posterUrl } : {}) } : null;
  }
  return media.media_type === "IMAGE" && url ? { imageUrl: url } : null;
}
