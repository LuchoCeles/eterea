"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ContentKey, ContentSnapshot, defaults, mergeTextSection, productsWithCategoryNames, resolveContent, type TextSectionKey, type Texts } from "@/lib/content";

type ContentContextValue = {
  content: Partial<ContentSnapshot>;
  products: ContentSnapshot["products"];
  setContent: (key: ContentKey, value: unknown) => void;
  setTextSection: (section: TextSectionKey, value: unknown) => void;
  hydrateContent: (snapshot: ContentSnapshot) => void;
};

const ContentContext = createContext<ContentContextValue | null>(null);

export function ContentProvider({ initialContent, children }: { initialContent: Partial<ContentSnapshot>; children: ReactNode }) {
  const [content, setContentState] = useState(initialContent);
  const hasHydratedContent = useRef(false);
  const products = useMemo(() => productsWithCategoryNames(
    resolveContent("products", content.products), resolveContent("categories", content.categories),
  ), [content.products, content.categories]);
  const setContent = useCallback((key: ContentKey, data: unknown) => {
    setContentState((current) => ({ ...current, [key]: resolveContent(key, data) }));
  }, []);
  const setTextSection = useCallback((section: TextSectionKey, data: unknown) => {
    setContentState((current) => ({
      ...current,
      texts: mergeTextSection(current.texts, section, data as Texts[TextSectionKey]),
    }));
  }, []);
  const hydrateContent = useCallback((snapshot: ContentSnapshot) => {
    if (hasHydratedContent.current) return;
    hasHydratedContent.current = true;
    const resolvedSnapshot = Object.fromEntries(
      (Object.keys(snapshot) as ContentKey[]).map((key) => [key, resolveContent(key, snapshot[key])]),
    ) as ContentSnapshot;
    setContentState(resolvedSnapshot);
  }, []);
  const value = useMemo<ContentContextValue>(() => ({
    content,
    products,
    setContent,
    setTextSection,
    hydrateContent,
  }), [content, products, setContent, setTextSection, hydrateContent]);
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function ContentSnapshotHydrator({
  initialContent,
  fallback = null,
  children,
}: {
  initialContent: ContentSnapshot;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const context = useContext(ContentContext);
  if (!context) throw new Error("ContentSnapshotHydrator debe usarse dentro de ContentProvider.");
  const { hydrateContent } = context;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hydrateContent(initialContent);
    setReady(true);
  }, [hydrateContent, initialContent]);

  return ready ? children : fallback;
}

export function useContent<K extends ContentKey>(key: K) {
  const context = useContext(ContentContext);
  const data = context?.content[key];
  return useMemo(() => {
    if (key === "products") {
      return (context?.products ?? resolveContent("products", undefined)) as ContentSnapshot[K];
    }
    return resolveContent(key, data ?? defaults[key]);
  }, [key, data, context?.products]);
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
