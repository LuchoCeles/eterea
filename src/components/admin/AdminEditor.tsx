"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebar, adminSections } from "@/components/admin/AdminSidebar";
import { AdminContentEditor } from "@/components/admin/AdminContentEditors";
import { AdminContentSkeleton } from "@/components/loading/AdminSkeleton";
import { useContent, useContentUpdater, saveContent } from "@/components/providers/ContentProvider";
import type { ContentKey } from "@/lib/content";

type AdminTheme = "light" | "dark";
const ADMIN_THEME_STORAGE_KEY = "eterea-admin-theme";
const ADMIN_SECTION_STORAGE_KEY = "eterea-admin-section";

export function AdminEditor({ email }: { email: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<ContentKey>("hero");
  const [sectionRestored, setSectionRestored] = useState(false);
  const [theme, setTheme] = useState<AdminTheme>("dark");
  const contentRef = useRef<HTMLElement>(null);
  const [uploadedImages, setUploadedImages] = useState<Partial<Record<ContentKey, string[]>>>({});
  const recordUploadedImages = (key: ContentKey, urls: string[]) => {
    setUploadedImages((current) => ({
      ...current,
      [key]: [...new Set([...(current[key] ?? []), ...urls])],
    }));
  };
  const clearUploadedImages = (key: ContentKey) => {
    setUploadedImages((current) => ({ ...current, [key]: [] }));
  };

  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY);
      if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme);

      const savedSection = adminSections.find(
        (section) => section.id === window.localStorage.getItem(ADMIN_SECTION_STORAGE_KEY),
      );
      if (savedSection) setTab(savedSection.id);
    } catch {
      // Si el navegador bloquea el almacenamiento, se usa la sección inicial.
    } finally {
      setSectionRestored(true);
    }
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, nextTheme);
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/auth");
    router.refresh();
  }

  function selectSection(section: ContentKey) {
    if (section === tab) return;
    contentRef.current?.scrollTo({ top: 0 });
    setTab(section);
    window.localStorage.setItem(ADMIN_SECTION_STORAGE_KEY, section);
  }

  const currentSection = adminSections.find((section) => section.id === tab);

  return (
    <div
      data-theme={theme}
      className="admin-theme flex h-dvh min-h-[480px] flex-col bg-background text-foreground"
    >
      <div className="admin-shell flex h-full w-full flex-col overflow-hidden">
        <AdminHeader email={email} onSignOut={signOut} theme={theme} onToggleTheme={toggleTheme} />
        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          <main
            ref={contentRef}
            id="admin-content"
            tabIndex={-1}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-10 focus:outline-none sm:px-7 lg:px-10 xl:px-12"
          >
            {sectionRestored ? (
              <div className="mx-auto max-w-[1120px]">
                <Editor
                  key={tab}
                  k={tab}
                  label={currentSection?.label ?? ""}
                  description={currentSection?.description ?? ""}
                  uploadedUrls={uploadedImages[tab] ?? []}
                  onUploaded={(urls) => recordUploadedImages(tab, urls)}
                  onSaved={() => clearUploadedImages(tab)}
                />
              </div>
            ) : (
              <AdminContentSkeleton />
            )}
          </main>
          {sectionRestored && <AdminSidebar activeSection={tab} onSelect={selectSection} />}
        </div>
      </div>
    </div>
  );
}

function Editor({
  k,
  label,
  description,
  uploadedUrls,
  onUploaded,
  onSaved,
}: {
  k: ContentKey;
  label: string;
  description: string;
  uploadedUrls: string[];
  onUploaded: (urls: string[]) => void;
  onSaved: () => void;
}) {
  const value = useContent(k);
  const updateContent = useContentUpdater();
  const [draft, setDraft] = useState<unknown>(() => structuredClone(value));
  const isProductEditor = k === "products";
  const draftRef = useRef(draft);
  const uploadedUrlsRef = useRef(uploadedUrls);
  const draftVersion = useRef(0);
  const lastSavedVersion = useRef(0);
  const initialValue = useRef(value);
  const skipAutoSave = useRef(false);
  const savingRef = useRef(false);
  const inFlightVersion = useRef(0);
  const saveAgain = useRef(false);
  const previousDraft = useRef(draft);
  const autoSaveRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    if (isProductEditor || Object.is(initialValue.current, value)) return;
    const nextDraft = structuredClone(value);
    draftRef.current = nextDraft;
    previousDraft.current = nextDraft;
    skipAutoSave.current = true;
    setDraft(nextDraft);
  }, [value, isProductEditor]);

  useEffect(() => {
    uploadedUrlsRef.current = uploadedUrls;
  }, [uploadedUrls]);

  useEffect(() => {
    autoSaveRef.current = saveAutomatically;
  });

  useEffect(() => {
    return () => {
      if (draftVersion.current <= lastSavedVersion.current) return;
      if (savingRef.current) saveAgain.current = true;
      void autoSaveRef.current();
    };
  }, [isProductEditor]);

  function changeDraft(next: unknown) {
    draftRef.current = next;
    draftVersion.current += 1;
    setDraft(next);
    if (isProductEditor) updateContent(k, next);
  }

  function canSaveDraft() {
    if (k !== "categories") return true;
    const categories = draftRef.current as { name?: string }[];
    return categories.every((category) => typeof category.name === "string" && category.name.trim().length > 0);
  }

  async function saveAutomatically() {
    if (savingRef.current) {
      if (draftVersion.current > inFlightVersion.current) saveAgain.current = true;
      return;
    }

    if (!canSaveDraft()) return;

    const version = draftVersion.current;
    const data = structuredClone(draftRef.current);
    const imageUrls = [...uploadedUrlsRef.current];
    savingRef.current = true;
    inFlightVersion.current = version;

    try {
      const result = await saveContent(k, data, imageUrls);
      lastSavedVersion.current = version;
      if (draftVersion.current === version) {
        updateContent(k, result.data);
        onSaved();
      } else {
        saveAgain.current = true;
      }
      if (result.cleanupPending) {
        toast.error(`Se guardaron los cambios, pero quedan ${result.cleanupPending} fotos pendientes de borrar en Cloudinary.`);
      }
    } catch (error) {
      if (draftVersion.current !== version) {
        saveAgain.current = true;
      } else {
        toast.error(error instanceof Error ? error.message : "No se pudo guardar. Revisá la conexión e intentá de nuevo.");
      }
    } finally {
      savingRef.current = false;
      if (saveAgain.current && lastSavedVersion.current < draftVersion.current) {
        saveAgain.current = false;
        window.setTimeout(() => void autoSaveRef.current(), 200);
      } else {
        saveAgain.current = false;
      }
    }
  }

  useEffect(() => {
    if (skipAutoSave.current) {
      skipAutoSave.current = false;
      return;
    }
    if (Object.is(previousDraft.current, draft)) return;
    previousDraft.current = draft;

    const timeout = window.setTimeout(() => void autoSaveRef.current(), 600);
    return () => window.clearTimeout(timeout);
  }, [draft]);

  if (draft === null) return <AdminContentSkeleton />;

  return (
    <div>
      <div className="sticky top-0 z-20 -mx-5 mb-7 flex items-center gap-4 bg-background/95 px-5 py-4 backdrop-blur-xl sm:-mx-7 sm:mb-8 sm:px-7 lg:-mx-10 lg:px-10 xl:-mx-12 xl:px-12">
        <div className="min-w-0 py-1">
          <h2 className="truncate font-display text-[28px] font-semibold leading-tight sm:text-[38px]">
            {label}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground sm:mt-2 sm:text-base">{description}</p>
        </div>
      </div>
      <AdminContentEditor
        k={k}
        draft={draft}
        onChange={changeDraft}
        onUploaded={(urls) => {
          uploadedUrlsRef.current = [...new Set([...uploadedUrlsRef.current, ...urls])];
          onUploaded(urls);
          if (isProductEditor) draftVersion.current += 1;
        }}
      />
    </div>
  );
}
