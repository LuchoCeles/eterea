import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const MAX_IMAGE_BYTES = 50_000_000;
const ALLOWED_TYPES = new Set(["image/avif", "image/gif", "image/jpeg", "image/png", "image/webp"]);

function signingSecret() {
  const value = process.env.AUTH_SECRET;
  if (!value || Buffer.byteLength(value) < 32) throw new Error("Configurá AUTH_SECRET para firmar enlaces de imágenes.");
  return value;
}

function mediaSignature(id: string, expires: number) {
  return createHmac("sha256", signingSecret()).update(`${id}.${expires}`).digest("hex");
}

export function verifyMediaSignature(id: string, expiresText: string | null, received: string | null) {
  const expires = Number(expiresText);
  if (!Number.isSafeInteger(expires) || expires <= Math.floor(Date.now() / 1000) || !received) return false;
  const expected = Buffer.from(mediaSignature(id, expires));
  const actual = Buffer.from(received);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function validateImageFile(file: File) {
  if (!ALLOWED_TYPES.has(file.type)) throw new Error("El archivo debe ser una imagen JPEG, PNG, WebP, GIF o AVIF.");
  if (!file.size || file.size > MAX_IMAGE_BYTES) throw new Error("Cada imagen puede pesar hasta 50 MB.");
}
