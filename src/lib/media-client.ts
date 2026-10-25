import type { ImageSection } from "@/lib/media";

async function removeUncommittedImages(urls: string[]) {
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
  const response = await fetch("/api/media", { method: "POST", body });
  const result = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;
  if (!response.ok || !result?.url) throw new Error(result?.error ?? "No se pudo subir la imagen.");
  return result.url;
}

export async function uploadImages(files: File[], section: ImageSection): Promise<string[]> {
  const urls: string[] = [];
  let nextIndex = 0;
  let firstError: Error | null = null;

  async function worker() {
    while (!firstError) {
      const index = nextIndex++;
      const file = files[index];
      if (!file) return;
      try {
        urls[index] = await uploadImage(file, section);
      } catch (error) {
        firstError = error instanceof Error ? error : new Error("No se pudieron subir las fotos.");
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(2, files.length) }, worker));
  if (firstError) {
    await removeUncommittedImages(urls.filter(Boolean));
    throw firstError;
  }
  return urls;
}
