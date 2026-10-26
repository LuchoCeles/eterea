import "server-only";
import { randomUUID } from "node:crypto";
import { destroyCloudinaryAsset } from "@/lib/cloudinary-api";
import { managedCloudinarySection, parseCloudinaryAssetUrl } from "@/lib/cloudinary-media";
import type { ImageSection } from "@/lib/media";
import { validateImageFile } from "@/server/media";

type CloudinaryConfig = { cloudName: string; apiKey: string; apiSecret: string; projectFolder: string };
type CloudinaryUploadResponse = { secure_url?: string; public_id?: string; existing?: boolean; overwritten?: boolean };
export class CloudinaryUploadCollisionError extends Error { }
function config(): CloudinaryConfig {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const projectFolder = "eterea";
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Configurá CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET.");
  }
  return { cloudName, apiKey, apiSecret, projectFolder };
}

function apiUrl(cloudName: string, action: string) {
  return `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${action}`;
}

function authHeader({ apiKey, apiSecret }: CloudinaryConfig) {
  return `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`;
}

export function cloudinaryPublicId(url: string): { cloudName: string; publicId: string } | null {
  const projectFolder = "eterea";
  return projectFolder ? parseCloudinaryAssetUrl(url, projectFolder) : null;
}

export function newCloudinaryPublicId(section: ImageSection) {
  const settings = config();
  return `${settings.projectFolder}/${section}/imagenes/${randomUUID()}`;
}

export async function uploadCloudinaryImage(file: File, section: ImageSection, publicId: string) {
  validateImageFile(file);
  const settings = config();
  const folder = `${settings.projectFolder}/${section}/imagenes`;
  if (managedCloudinarySection(publicId, settings.projectFolder) !== section) {
    throw new Error("El identificador de la imagen no es válido.");
  }
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
  if (response.status === 409 || payload.existing || payload.overwritten) {
    throw new CloudinaryUploadCollisionError("Cloudinary encontró una imagen con el mismo identificador. Reintentá la carga.");
  }
  if (!response.ok || !payload.secure_url) {
    throw new Error("Cloudinary no pudo subir la imagen. Revisá las credenciales y volvé a intentar.");
  }
  const asset = cloudinaryPublicId(payload.secure_url);
  if (asset?.cloudName !== settings.cloudName || asset.publicId !== publicId || payload.public_id !== publicId) {
    throw new Error("Cloudinary devolvió una URL de imagen inesperada.");
  }
  return payload.secure_url;
}

export async function deleteCloudinaryImage(url: string) {
  const asset = cloudinaryPublicId(url);
  if (!asset) throw new Error("La URL no corresponde a una imagen administrada por este proyecto.");
  const settings = config();
  if (asset.cloudName !== settings.cloudName) {
    throw new Error("La imagen no pertenece a la carpeta de este proyecto en Cloudinary.");
  }

  await deleteCloudinaryPublicId(asset.publicId);
}

export async function deleteCloudinaryPublicId(publicId: string) {
  const settings = config();
  if (!managedCloudinarySection(publicId, settings.projectFolder)) {
    throw new Error("El identificador de la imagen no pertenece a este proyecto.");
  }
  await destroyCloudinaryAsset(apiUrl(settings.cloudName, "image/destroy"), authHeader(settings), publicId);
}
