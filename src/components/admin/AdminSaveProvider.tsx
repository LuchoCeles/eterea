"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { saveContent, saveTextSection, useContentUpdater, useTextSectionUpdater } from "@/components/providers/ContentProvider";
import type { ContentKey, TextSectionKey, Texts } from "@/lib/content";

type DraftEntry = {
  data: unknown;
  savedData: unknown;
  version: number;
  uploadedUrls: string[];
  saving: boolean;
  error: string | null;
};

type AdminSaveContextValue = {
  drafts: Partial<Record<ContentKey, DraftEntry>>;
  textDrafts: Partial<Record<TextSectionKey, DraftEntry>>;
  change: (key: ContentKey, initial: unknown, data: unknown) => void;
  uploaded: (key: ContentKey, initial: unknown, urls: string[]) => void;
  save: (key: ContentKey, initial: unknown) => Promise<void>;
  changeText: <K extends TextSectionKey>(section: K, initial: Texts[K], data: Texts[K]) => void;
  uploadedText: (section: TextSectionKey, initial: unknown, urls: string[]) => void;
  saveText: (section: TextSectionKey, initial: unknown) => Promise<void>;
  hasPendingChanges: () => boolean;
};

const AdminSaveContext = createContext<AdminSaveContextValue | null>(null);

function initialEntry(data: unknown): DraftEntry {
  return { data, savedData: data, version: 0, uploadedUrls: [], saving: false, error: null };
}

export function hasUnsavedChanges(entry: DraftEntry | undefined) {
  return !!entry && JSON.stringify(entry.data) !== JSON.stringify(entry.savedData);
}

export function AdminSaveProvider({ children }: { children: ReactNode }) {
  const updateContent = useContentUpdater();
  const updateTextSection = useTextSectionUpdater();
  const [drafts, setDrafts] = useState<Partial<Record<ContentKey, DraftEntry>>>({});
  const [textDrafts, setTextDrafts] = useState<Partial<Record<TextSectionKey, DraftEntry>>>({});
  const draftsRef = useRef(drafts);
  const textDraftsRef = useRef(textDrafts);
  const savingKeys = useRef(new Set<ContentKey>());
  const savingTextKeys = useRef(new Set<TextSectionKey>());
  const textSaveQueue = useRef<Promise<void>>(Promise.resolve());

  function setEntry(key: ContentKey, initial: unknown, update: (entry: DraftEntry) => DraftEntry) {
    const next = { ...draftsRef.current, [key]: update(draftsRef.current[key] ?? initialEntry(initial)) };
    draftsRef.current = next;
    setDrafts(next);
  }

  function hasPendingChanges() {
    return [...Object.values(draftsRef.current), ...Object.values(textDraftsRef.current)].some(
      (entry) => entry && (hasUnsavedChanges(entry) || entry.saving),
    );
  }

  function setTextEntry(section: TextSectionKey, initial: unknown, update: (entry: DraftEntry) => DraftEntry) {
    const next = { ...textDraftsRef.current, [section]: update(textDraftsRef.current[section] ?? initialEntry(initial)) };
    textDraftsRef.current = next;
    setTextDrafts(next);
  }

  function changeText<K extends TextSectionKey>(section: K, initial: Texts[K], data: Texts[K]) {
    setTextEntry(section, initial, (entry) => ({ ...entry, data, version: entry.version + 1, error: null }));
  }

  function uploadedText(section: TextSectionKey, initial: unknown, urls: string[]) {
    setTextEntry(section, initial, (entry) => ({
      ...entry,
      uploadedUrls: [...new Set([...entry.uploadedUrls, ...urls])],
    }));
  }

  async function saveText(section: TextSectionKey, initial: unknown) {
    if (savingTextKeys.current.has(section)) return;
    const entry = textDraftsRef.current[section];
    if (!entry || !hasUnsavedChanges(entry)) return;
    const version = entry.version;
    const data = structuredClone(entry.data) as Texts[typeof section];
    const uploadedUrls = [...entry.uploadedUrls];
    savingTextKeys.current.add(section);
    setTextEntry(section, initial, (current) => ({ ...current, saving: true, error: null }));

    const run = async () => {
      try {
        const saved = await saveTextSection(section, data, uploadedUrls);
        updateTextSection(section, saved);
        const hasNewerChanges = textDraftsRef.current[section]!.version !== version;
        setTextEntry(section, initial, (current) => ({
          ...current,
          data: hasNewerChanges ? current.data : saved,
          savedData: saved,
          uploadedUrls: current.uploadedUrls.filter((url) => !uploadedUrls.includes(url)),
          saving: false,
        }));
        if (!hasNewerChanges) toast.success("Sección guardada");
      } catch (error) {
        const message = error instanceof Error ? error.message : "No se pudo guardar la sección. Intentá de nuevo.";
        setTextEntry(section, initial, (current) => ({ ...current, saving: false, error: message }));
        toast.error(message);
      } finally {
        savingTextKeys.current.delete(section);
      }
    };
    const queued = textSaveQueue.current.then(run, run);
    textSaveQueue.current = queued;
    await queued;
  }

  useEffect(() => {
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (!hasPendingChanges()) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, []);

  function change(key: ContentKey, initial: unknown, data: unknown) {
    setEntry(key, initial, (entry) => ({ ...entry, data, version: entry.version + 1, error: null }));
  }

  function uploaded(key: ContentKey, initial: unknown, urls: string[]) {
    setEntry(key, initial, (entry) => ({
      ...entry,
      uploadedUrls: [...new Set([...entry.uploadedUrls, ...urls])],
    }));
  }

  async function save(key: ContentKey, initial: unknown) {
    if (savingKeys.current.has(key)) return;
    const entry = draftsRef.current[key];
    if (!entry || !hasUnsavedChanges(entry)) return;
    if (key === "categories" && !(entry.data as { name?: string }[]).every(
      (category) => typeof category.name === "string" && category.name.trim().length > 0,
    )) {
      const message = "Cada categoría necesita un nombre válido antes de guardar.";
      setEntry(key, initial, (current) => ({ ...current, error: message }));
      toast.error(message);
      return;
    }

    const version = entry.version;
    const data = structuredClone(entry.data);
    const uploadedUrls = [...entry.uploadedUrls];
    savingKeys.current.add(key);
    setEntry(key, initial, (current) => ({ ...current, saving: true, error: null }));

    try {
      const result = await saveContent(key, data, uploadedUrls);
      updateContent(key, result.data);
      const hasNewerChanges = draftsRef.current[key]!.version !== version;
      setEntry(key, initial, (current) => ({
        ...current,
        data: hasNewerChanges ? current.data : result.data,
        savedData: result.data,
        uploadedUrls: current.uploadedUrls.filter((url) => !uploadedUrls.includes(url)),
        saving: false,
      }));
      if (!hasNewerChanges) toast.success("Cambios guardados");
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo guardar. Intentá de nuevo.";
      setEntry(key, initial, (current) => ({ ...current, saving: false, error: message }));
      toast.error(message);
    } finally {
      savingKeys.current.delete(key);
    }
  }

  return (
    <AdminSaveContext.Provider value={{ drafts, textDrafts, change, uploaded, save, changeText, uploadedText, saveText, hasPendingChanges }}>
      {children}
    </AdminSaveContext.Provider>
  );
}

export function useAdminSave() {
  const context = useContext(AdminSaveContext);
  if (!context) throw new Error("useAdminSave debe usarse dentro de AdminSaveProvider.");
  return context;
}
