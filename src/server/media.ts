import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
export { validateImageFile } from "@/lib/image-file";

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
