const MARKER = "local-banner:";
const PREVIEW_KEY = "eterea-banner-preview:";
const DB_NAME = "eterea-banner-drafts";
const STORE_NAME = "images";
const MAX_BYTES = 50_000_000;
const TYPES = new Set(["image/avif", "image/gif", "image/jpeg", "image/png", "image/webp"]);

const files = new Map<string, File>();
const sources = new Map<string, string>();

export function isStagedHeroImage(value: string) {
  return value.startsWith(MARKER);
}

function imageId(marker: string) {
  if (!/^local-banner:[\da-f-]{36}$/i.test(marker)) throw new Error("La imagen local no es válida.");
  return marker.slice(MARKER.length);
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("No se pudo guardar la imagen en este navegador."));
  });
}

async function putFile(id: string, file: File) {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(file, id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error("No se pudo guardar la imagen en este navegador."));
    });
  } finally {
    db.close();
  }
}

async function readFile(id: string): Promise<File | null> {
  const db = await openDatabase();
  try {
    return await new Promise<File | null>((resolve, reject) => {
      const request = db.transaction(STORE_NAME).objectStore(STORE_NAME).get(id);
      request.onsuccess = () => resolve(request.result instanceof File ? request.result : null);
      request.onerror = () => reject(new Error("No se pudo recuperar la imagen local."));
    });
  } finally {
    db.close();
  }
}

async function savePreview(id: string, file: File) {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 900 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    localStorage.setItem(PREVIEW_KEY + id, canvas.toDataURL("image/webp", 0.7));
  } catch {
    // El archivo original queda en IndexedDB aunque el navegador rechace la miniatura.
  }
}

export function stageHeroImage(file: File) {
  if (!TYPES.has(file.type)) throw new Error("Elegí una imagen JPEG, PNG, WebP, GIF o AVIF.");
  if (!file.size || file.size > MAX_BYTES) throw new Error("La imagen puede pesar hasta 50 MB.");
  const id = crypto.randomUUID();
  const marker = MARKER + id;
  files.set(marker, file);
  sources.set(marker, URL.createObjectURL(file));
  const ready = putFile(id, file).then(() => savePreview(id, file));
  return { marker, ready };
}

export function stagedHeroPreview(marker: string) {
  if (!isStagedHeroImage(marker)) return marker;
  if (typeof window === "undefined") return "";
  const source = sources.get(marker);
  if (source) return source;
  try {
    return localStorage.getItem(PREVIEW_KEY + imageId(marker)) ?? "";
  } catch {
    return "";
  }
}

export async function stagedHeroFile(marker: string) {
  const cached = files.get(marker);
  if (cached) return cached;
  const file = await readFile(imageId(marker));
  if (!file) throw new Error("La imagen local ya no está disponible. Elegí el archivo otra vez.");
  files.set(marker, file);
  return file;
}

export async function stagedHeroSource(marker: string) {
  const current = sources.get(marker);
  if (current) return current;
  const file = await stagedHeroFile(marker);
  const source = URL.createObjectURL(file);
  sources.set(marker, source);
  return source;
}

export async function removeStagedHeroImage(marker: string) {
  const id = imageId(marker);
  const source = sources.get(marker);
  if (source) URL.revokeObjectURL(source);
  sources.delete(marker);
  files.delete(marker);
  localStorage.removeItem(PREVIEW_KEY + id);
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error("No se pudo limpiar la imagen local."));
    });
  } finally {
    db.close();
  }
}
