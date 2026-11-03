import type { ImageSection } from "@/lib/media";

export async function removeUncommittedImages(urls: string[]) {
  if (!urls.length) return;
  await fetch("/api/media", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urls }),
  });
}

export async function uploadImage(file: File, section: ImageSection): Promise<string> {
  const body = new FormData();
  body.set("file", file);
  body.set("section", section);
  let response: Response;
  try {
    response = await fetch("/api/media", { method: "POST", body });
  } catch {
    throw new Error(
      `No se pudo conectar con el servidor al subir “${file.name}”. Revisá la conexión e intentá de nuevo.`,
    );
  }
  const result = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;
  if (!response.ok || !result?.url) throw new Error(result?.error ?? "No se pudo subir la imagen.");
  return result.url;
}

export async function uploadImages(files: File[], section: ImageSection): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    try {
      urls.push(await uploadImage(file, section));
    } catch (error) {
      await removeUncommittedImages(urls).catch(() => undefined);
      throw error instanceof Error ? error : new Error("No se pudieron subir las fotos.");
    }
  }
  return urls;
}
