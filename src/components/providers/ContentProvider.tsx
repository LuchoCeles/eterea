"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { ContentKey, ContentSnapshot, defaults, mergeTextSection, productsWithCategoryNames, resolveContent, type TextSectionKey, type Texts } from "@/lib/content";

type ContentContextValue = {
  content: Partial<ContentSnapshot>;
  setContent: (key: ContentKey, value: unknown) => void;
  setTextSection: (section: TextSectionKey, value: unknown) => void;
};

const ContentContext = createContext<ContentContextValue | null>(null);

export function ContentProvider({ initialContent, children }: { initialContent: Partial<ContentSnapshot>; children: ReactNode }) {
  const [content, setContentState] = useState(initialContent);
  const value: ContentContextValue = {
    content,
    setContent: (key, data) => setContentState((current) => ({ ...current, [key]: resolveContent(key, data) })),
    setTextSection: (section, data) => setContentState((current) => ({
      ...current,
      texts: mergeTextSection(current.texts, section, data as Texts[TextSectionKey]),
    })),
  };
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent<K extends ContentKey>(key: K) {
  const context = useContext(ContentContext);
  const data = context?.content[key];
  const categories = context?.content.categories;
  return useMemo(() => {
    const resolved = resolveContent(key, data ?? defaults[key]);
    if (key === "products") {
      return productsWithCategoryNames(resolved as ContentSnapshot["products"], resolveContent("categories", categories)) as ContentSnapshot[K];
    }
    return resolved;
  }, [key, data, categories]);
}

export async function saveContent(key: ContentKey, data: unknown, uploadedUrls: string[] = []) {
  const response = await fetch(`/api/content/${key}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data, uploadedUrls }),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(result?.error ?? "No se pudo guardar el contenido.");
  }
  const result: unknown = await response.json();
  if (!result || typeof result !== "object" || !("data" in result)) {
    throw new Error("El servidor no confirmó el guardado. Intentá de nuevo.");
  }
  return result as { data: unknown; cleanupPending?: number };
}

export async function saveTextSection<K extends TextSectionKey>(section: K, data: Texts[K], uploadedUrls: string[] = []) {
  const response = await fetch(`/api/content/texts/${section}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data, uploadedUrls }),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(result?.error ?? "No se pudo guardar la sección.");
  }
  const result: unknown = await response.json();
  if (!result || typeof result !== "object" || !("data" in result)) {
    throw new Error("El servidor no confirmó el guardado. Intentá de nuevo.");
  }
  return (result as { data: Texts[K] }).data;
}

export function useContentUpdater() {
  const context = useContext(ContentContext);
  if (!context) throw new Error("useContentUpdater debe usarse dentro de ContentProvider.");
  return context.setContent;
}

export function useTextSectionUpdater() {
  const context = useContext(ContentContext);
  if (!context) throw new Error("useTextSectionUpdater debe usarse dentro de ContentProvider.");
  return context.setTextSection;
}
