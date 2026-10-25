import { imageSections } from "@/lib/media";

const CLOUDINARY_HOST = "res.cloudinary.com";
const UUID_PATTERN = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

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
  const [root, section, imagesFolder, filename, ...extra] = assetPath.slice(1);
  const id = filename?.replace(/\.[^.]+$/, "");
  if (extra.length || root !== projectFolder || !imageSections.includes(section as (typeof imageSections)[number]) || imagesFolder !== "imagenes" || !id || !UUID_PATTERN.test(id)) return null;
  return { cloudName, publicId: `${root}/${section}/${imagesFolder}/${id}` };
}

export function planCloudinaryDeletions(candidates: string[], referencedUrls: Iterable<string>, projectFolder: string) {
  const referenced = new Set(referencedUrls);
  return [...new Set(candidates)].filter((url) => !referenced.has(url) && parseCloudinaryAssetUrl(url, projectFolder) !== null);
}
