import { imageSections } from "@/lib/media";

const CLOUDINARY_HOST = "res.cloudinary.com";
const UUID_PATTERN = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

export function managedCloudinarySection(publicId: string, projectFolder: string) {
  const [root, section, imagesFolder, id, ...extra] = publicId.split("/");
  if (extra.length || root !== projectFolder || imagesFolder !== "imagenes" || !id || !UUID_PATTERN.test(id)) return null;
  return imageSections.includes(section as (typeof imageSections)[number]) ? section : null;
}

export function parseCloudinaryAssetUrl(url: string, projectFolder: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" || parsed.hostname !== CLOUDINARY_HOST || parsed.search || parsed.hash) return null;

  const parts = parsed.pathname.split("/").filter(Boolean);
  const [cloudName, resourceType, deliveryType, ...assetPath] = parts;
  if (!cloudName || resourceType !== "image" || deliveryType !== "upload" || !/^v\d+$/.test(assetPath[0] ?? "")) return null;
  const filename = assetPath.at(-1);
  const id = filename?.replace(/\.[^.]+$/, "");
  const publicId = [...assetPath.slice(1, -1), id].join("/");
  if (!managedCloudinarySection(publicId, projectFolder)) return null;
  return { cloudName, publicId };
}

const responsiveWidths = [240, 480, 720, 960, 1280, 1920];

export function responsiveCloudinaryImage(url: string) {
  if (!parseCloudinaryAssetUrl(url, "eterea")) return { src: url, srcSet: undefined };
  const marker = "/image/upload/";
  const variant = (width: number) => url.replace(marker, `${marker}f_auto,q_auto,c_limit,w_${width}/`);
  return {
    src: variant(960),
    srcSet: responsiveWidths.map((width) => `${variant(width)} ${width}w`).join(", "),
  };
}

export function planCloudinaryDeletions(candidates: string[], referencedUrls: Iterable<string>, projectFolder: string) {
  const referenced = new Set(referencedUrls);
  return [...new Set(candidates)].filter((url) => !referenced.has(url) && parseCloudinaryAssetUrl(url, projectFolder) !== null);
}

export function reconcileCloudinaryQueue(queuedUrls: string[], candidates: string[], referencedUrls: Iterable<string>, projectFolder: string) {
  const referenced = new Set(referencedUrls);
  const retainedQueue = planCloudinaryDeletions(queuedUrls, referenced, projectFolder);
  const retainedSet = new Set(retainedQueue);
  const obsoleteQueue = queuedUrls.filter((url) => !retainedSet.has(url));
  const toQueue = planCloudinaryDeletions(candidates, referenced, projectFolder)
    .filter((url) => !retainedSet.has(url));
  return { obsoleteQueue, toQueue, pending: retainedQueue.length + toQueue.length };
}
