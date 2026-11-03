const MAX_IMAGE_BYTES = 50_000_000;
const ALLOWED_TYPES = new Set(["image/avif", "image/gif", "image/jpeg", "image/png", "image/webp"]);

function startsWith(bytes: Uint8Array, signature: number[]) {
  return signature.every((byte, index) => bytes[index] === byte);
}

function ascii(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.subarray(start, end));
}

function detectedImageType(bytes: Uint8Array, fileSize: number): string | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (ascii(bytes, 0, 6) === "GIF87a" || ascii(bytes, 0, 6) === "GIF89a") return "image/gif";
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP" &&
    ["VP8 ", "VP8L", "VP8X"].includes(ascii(bytes, 12, 16))) return "image/webp";
  if (bytes.length >= 16 && ascii(bytes, 4, 8) === "ftyp") {
    const boxSize = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0);
    if (boxSize >= 16 && boxSize <= fileSize) {
      for (let offset = 8; offset + 4 <= Math.min(boxSize, bytes.length); offset += offset === 8 ? 8 : 4) {
        if (["avif", "avis"].includes(ascii(bytes, offset, offset + 4))) return "image/avif";
      }
    }
  }
  return null;
}

export async function validateImageFile(file: File) {
  if (!ALLOWED_TYPES.has(file.type)) throw new Error("El archivo debe ser una imagen JPEG, PNG, WebP, GIF o AVIF.");
  if (!file.size || file.size > MAX_IMAGE_BYTES) throw new Error("Cada imagen puede pesar hasta 50 MB.");
  const header = new Uint8Array(await file.slice(0, 256).arrayBuffer());
  if (detectedImageType(header, file.size) !== file.type) {
    throw new Error("El contenido del archivo no coincide con un formato de imagen permitido.");
  }
}
