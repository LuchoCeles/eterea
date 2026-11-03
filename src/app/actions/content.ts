"use server";

import { after } from "next/server";
import type { ContentKey, Slide, TextSectionKey, Texts } from "@/lib/content";
import { contentSchemas, textSectionKeys, textSectionSchemas } from "@/lib/content-schema";
import { ContentValidationError, contentKeys, drainCloudinaryCleanupQueue, saveContentAndCleanImages, saveSingleHeroSlide, saveTextSection } from "@/server/content";
import { isCurrentUserAdmin } from "@/server/auth";
import { invalidateStorefrontContent } from "@/server/storefront-content";

function scheduleCleanup(cleanupPending: number) {
  if (!cleanupPending) return;
  after(async () => {
    try {
      await drainCloudinaryCleanupQueue();
    } catch (error) {
      console.error("No se pudo completar la limpieza de fotos pendientes.", error);
    }
  });
}

function validUploadedUrls(value: unknown): value is string[] {
  return Array.isArray(value) && value.length <= 100 && value.every((url) => typeof url === "string");
}

export async function saveContentAction(key: ContentKey, data: unknown, uploadedUrls: string[] = []) {
  if (!(await isCurrentUserAdmin())) return { error: "No autorizado." };
  if (key === "instagram" || !contentKeys.includes(key)) return { error: "Sección desconocida." };
  if (!validUploadedUrls(uploadedUrls)) return { error: "La lista de imágenes no es válida." };
  if (key === "contact" && data && typeof data === "object" && "instagramUsername" in data) {
    return { error: "El usuario de Instagram se obtiene de la cuenta conectada con Meta." };
  }
  const parsed = contentSchemas[key].safeParse(data);
  if (!parsed.success) return { error: key === "categories" ? "Cada categoría necesita un nombre válido." : "El formato del contenido no es válido." };
  try {
    const result = await saveContentAndCleanImages(key, parsed.data, uploadedUrls);
    invalidateStorefrontContent();
    scheduleCleanup(result.cleanupPending);
    return { data: result.data };
  } catch (error) {
    return { error: error instanceof ContentValidationError ? error.message : "No se pudo guardar el contenido." };
  }
}

export async function saveHeroSlideAction(index: number, slide: Slide, uploadedUrls: string[] = []) {
  if (!(await isCurrentUserAdmin())) return { error: "No autorizado." };
  if (!validUploadedUrls(uploadedUrls)) return { error: "La lista de imágenes no es válida." };
  try {
    const result = await saveSingleHeroSlide(index, slide, uploadedUrls);
    invalidateStorefrontContent();
    scheduleCleanup(result.cleanupPending);
    return { data: result.data };
  } catch (error) {
    return { error: error instanceof ContentValidationError ? error.message : "No se pudo guardar el banner." };
  }
}

export async function saveTextSectionAction<K extends TextSectionKey>(section: K, data: Texts[K], uploadedUrls: string[] = []) {
  if (!(await isCurrentUserAdmin())) return { error: "No autorizado." };
  if (!textSectionKeys.includes(section)) return { error: "Sección desconocida." };
  if (!validUploadedUrls(uploadedUrls)) return { error: "La lista de imágenes no es válida." };
  const parsed = textSectionSchemas[section].safeParse(data);
  if (!parsed.success) return { error: "El formato de esta sección no es válido." };
  try {
    const result = await saveTextSection(section, parsed.data, uploadedUrls);
    invalidateStorefrontContent();
    scheduleCleanup(result.cleanupPending);
    return { data: result.data as Texts[K] };
  } catch (error) {
    if (!(error instanceof ContentValidationError)) console.error("No se pudo guardar la sección del inicio.", error);
    return { error: error instanceof ContentValidationError ? error.message : "No se pudo guardar la sección. Intentá de nuevo." };
  }
}
