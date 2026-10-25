"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { ContentKey, ContentSnapshot, defaults, resolveContent } from "@/lib/content";

type ContentContextValue = {
  content: Partial<ContentSnapshot>;
  setContent: (key: ContentKey, value: unknown) => void;
};

const ContentContext = createContext<ContentContextValue | null>(null);

export function ContentProvider({ initialContent, children }: { initialContent: Partial<ContentSnapshot>; children: ReactNode }) {
  const [content, setContentState] = useState(initialContent);
  const value: ContentContextValue = {
    content,
    setContent: (key, data) => setContentState((current) => ({ ...current, [key]: resolveContent(key, data) })),
  };
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent<K extends ContentKey>(key: K) {
  const context = useContext(ContentContext);
  const data = context?.content[key];
  return useMemo(() => resolveContent(key, data ?? defaults[key]), [key, data]);
}

export async function saveContent(key: ContentKey, data: unknown, uploadedUrls: string[] = []) {
  const response = await fetch(`/api/content/${key}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data, uploadedUrls }),
  });
  if (!response.ok) throw new Error("No se pudo guardar el contenido.");
  return response.json() as Promise<{ data: unknown; cleanupPending?: number }>;
}

export function useContentUpdater() {
  const context = useContext(ContentContext);
  if (!context) throw new Error("useContentUpdater debe usarse dentro de ContentProvider.");
  return context.setContent;
}
