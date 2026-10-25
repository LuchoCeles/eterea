import "server-only";
import { randomUUID } from "node:crypto";
import { destroyCloudinaryAsset } from "@/lib/cloudinary-api";
import { parseCloudinaryAssetUrl } from "@/lib/cloudinary-media";
import { imageSections, type ImageSection } from "@/lib/media";
import { validateImageFile } from "@/server/media";

function configuredProjectFolder() {
  const projectFolder = process.env.CLOUDINARY_PROJECT_FOLDER ?? "eterea";
  return /^[a-z0-9][a-z0-9_-]{0,62}$/i.test(projectFolder) ? projectFolder : null;
}

type CloudinaryConfig = { cloudName: string; apiKey: string; apiSecret: string; projectFolder: string };
type CloudinaryUploadResponse = { secure_url?: string };
function config(): CloudinaryConfig {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const projectFolder = configuredProjectFolder();
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Configurá CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET.");
  }
  if (!projectFolder) throw new Error("CLOUDINARY_PROJECT_FOLDER debe ser un nombre simple, sin barras.");
  return { cloudName, apiKey, apiSecret, projectFolder };
}

function apiUrl(cloudName: string, action: string) {
  return `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${action}`;
}

function authHeader({ apiKey, apiSecret }: CloudinaryConfig) {
  return `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`;
}

export function cloudinaryPublicId(url: string): { cloudName: string; publicId: string } | null {
  const projectFolder = configuredProjectFolder();
  return projectFolder ? parseCloudinaryAssetUrl(url, projectFolder) : null;
}

export async function uploadCloudinaryImage(file: File, section: ImageSection) {
  validateImageFile(file);
  const settings = config();
  const folder = `${settings.projectFolder}/${section}/imagenes`;
  const publicId = `${folder}/${randomUUID()}`;
  const body = new FormData();
  body.set("file", new Blob([await file.arrayBuffer()], { type: file.type }), file.name || "imagen");
  body.set("folder", folder);
  body.set("public_id", publicId.slice(folder.length + 1));
  body.set("overwrite", "false");

  const response = await fetch(apiUrl(settings.cloudName, "image/upload"), {
    method: "POST",
    headers: { Authorization: authHeader(settings) },
    body,
    signal: AbortSignal.timeout(60_000),
  });
  const payload = (await response.json().catch(() => ({}))) as CloudinaryUploadResponse;
  if (!response.ok || !payload.secure_url) {
    throw new Error("Cloudinary no pudo subir la imagen. Revisá las credenciales y volvé a intentar.");
  }
  const asset = cloudinaryPublicId(payload.secure_url);
  if (asset?.cloudName !== settings.cloudName || asset.publicId !== publicId) {
    await deleteCloudinaryImage(payload.secure_url).catch(() => undefined);
    throw new Error("Cloudinary devolvió una URL de imagen inesperada.");
  }
  return payload.secure_url;
}

export async function deleteCloudinaryImage(url: string) {
  const asset = cloudinaryPublicId(url);
  if (!asset) throw new Error("La URL no corresponde a una imagen administrada por este proyecto.");
  const settings = config();
  if (asset.cloudName !== settings.cloudName || !asset.publicId.startsWith(`${settings.projectFolder}/`)) {
    throw new Error("La imagen no pertenece a la carpeta de este proyecto en Cloudinary.");
  }

  await destroyCloudinaryAsset(apiUrl(settings.cloudName, "image/destroy"), authHeader(settings), asset.publicId);
}
