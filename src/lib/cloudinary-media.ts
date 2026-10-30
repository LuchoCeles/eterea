import { imageSections } from "@/lib/media";
import { PRODUCT_COVER_RATIO, cropRegion, imageRatio, validCropSettings, type CropSettings, type ImageSettings } from "@/lib/image-presentation";

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

export function responsiveCloudinaryImage(url: string, settings?: ImageSettings | CropSettings | null, cover = false) {
  if (!parseCloudinaryAssetUrl(url, "eterea")) return { src: url, srcSet: undefined };
  const marker = "/image/upload/";
  const ratio = cover ? PRODUCT_COVER_RATIO : settings && "format" in settings
    ? imageRatio(settings.format, settings.width, settings.height) : 0;
  const region = settings && ratio && validCropSettings(settings) ? cropRegion(settings, ratio) : null;
  let cropWidth = region ? Math.max(1, Math.min(settings!.width, Math.round(region.width * settings!.width))) : 0;
  let cropHeight = region ? Math.max(1, Math.min(settings!.height, Math.round(region.height * settings!.height))) : 0;
  if (cover && region && settings!.width >= 4 && settings!.height >= 5) {
    const units = Math.max(1, Math.floor(Math.min(region.width * settings!.width / 4, region.height * settings!.height / 5)));
    cropWidth = units * 4;
    cropHeight = units * 5;
  }
  const cropX = region ? Math.max(0, Math.min(settings!.width - cropWidth,
    Math.round((region.left + region.width / 2) * settings!.width - cropWidth / 2))) : 0;
  const cropY = region ? Math.max(0, Math.min(settings!.height - cropHeight,
    Math.round((region.top + region.height / 2) * settings!.height - cropHeight / 2))) : 0;
  const crop = region && (cropWidth !== settings!.width || cropHeight !== settings!.height)
    ? `c_crop,x_${cropX},y_${cropY},w_${cropWidth},h_${cropHeight}/` : "";
  const variant = (width: number) => url.replace(marker, `${marker}${crop}f_auto,q_auto,c_limit,w_${width}/`);
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
