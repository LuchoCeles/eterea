"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebar, adminSections } from "@/components/admin/AdminSidebar";
import { AdminContentEditor } from "@/components/admin/AdminContentEditors";
import { AdminSectionSkeleton } from "@/components/loading/AdminSectionSkeleton";
import { useContent, useContentUpdater, saveContent } from "@/components/providers/ContentProvider";
import type { ContentKey } from "@/lib/content";

type AdminTheme = "light" | "dark";
type SaveStatus = "saved" | "pending" | "saving" | "error";
const ADMIN_THEME_STORAGE_KEY = "eterea-admin-theme";
const ADMIN_SECTION_STORAGE_KEY = "eterea-admin-section";

export function AdminEditor({ email, children }: { email: string; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const contentRef = useRef<HTMLElement>(null);
  const [theme, setTheme] = useState<AdminTheme>("dark");
  const activeSection = adminSections.find((section) => pathname === `/admin/${section.slug}`)?.id;

  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY);
      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme);
        document.documentElement.dataset.adminTheme = savedTheme;
      }
    } catch {
      // Se conserva el tema inicial si el navegador bloquea el almacenamiento.
    }
  }, []);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
    if (!activeSection) return;
    try {
      window.localStorage.setItem(ADMIN_SECTION_STORAGE_KEY, activeSection);
    } catch {
      // La navegación sigue funcionando aunque el navegador bloquee el almacenamiento.
    }
  }, [activeSection]);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.adminTheme = nextTheme;
    try {
      window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, nextTheme);
    } catch {
      // El cambio de tema sigue funcionando aunque el navegador bloquee el almacenamiento.
    }
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/auth");
    router.refresh();
  }

  return (
    <div className="admin-theme flex h-dvh min-h-[480px] flex-col bg-background text-foreground">
      <div className="admin-shell relative flex h-full w-full flex-col overflow-hidden">
        <AdminHeader email={email} onSignOut={signOut} theme={theme} onToggleTheme={toggleTheme} />
        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          <main
            ref={contentRef}
            id="admin-content"
            tabIndex={-1}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] focus:outline-none sm:px-7 sm:pb-10 lg:px-10 xl:px-12"
          >
            {children}
          </main>
          <AdminSidebar activeSection={activeSection} />
        </div>
      </div>
    </div>
  );
}
export function AdminSectionEditor({ section }: { section: ContentKey }) {
  const currentSection = adminSections.find((item) => item.id === section);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const fillsPanel = section === "categories" || section === "products";

  return (
    <div className={fillsPanel ? "w-full" : "mx-auto max-w-[1120px]"}>
      <Editor
        key={section}
        k={section}
        label={currentSection?.label ?? ""}
        description={currentSection?.description ?? ""}
        uploadedUrls={uploadedImages}
        onUploaded={(urls) => setUploadedImages((current) => [...new Set([...current, ...urls])])}
        onSaved={() => setUploadedImages([])}
      />
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
  const saveStatus = useRef<SaveStatus>("saved");
  const saveToastId = useRef<string | number | undefined>(undefined);
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
    if (draftVersion.current > lastSavedVersion.current) return;
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

  useEffect(() => {
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (draftVersion.current <= lastSavedVersion.current && !savingRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const saveWhenHidden = () => {
      if (document.visibilityState === "hidden" && draftVersion.current > lastSavedVersion.current) {
        void autoSaveRef.current();
      }
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    document.addEventListener("visibilitychange", saveWhenHidden);
    return () => {
      window.removeEventListener("beforeunload", warnBeforeLeaving);
      document.removeEventListener("visibilitychange", saveWhenHidden);
    };
  }, []);

  function changeDraft(next: unknown, saveImmediately = false) {
    draftRef.current = next;
    draftVersion.current += 1;
    setDraft(next);
    if (isProductEditor) updateContent(k, next);
    if (saveImmediately) {
      void saveAutomatically();
    } else {
      showPendingToast();
    }
  }

  function showPendingToast() {
    if (saveStatus.current === "pending") return;
    saveStatus.current = "pending";
    saveToastId.current = toast.info("Cambios sin guardar", {
      id: saveToastId.current,
      duration: Infinity,
      action: null,
    });
  }

  function showSaveError(message: string) {
    saveStatus.current = "error";
    saveToastId.current = toast.error(message, {
      id: saveToastId.current,
      duration: Infinity,
      action: {
        label: "Reintentar",
        onClick: (event) => {
          event.preventDefault();
          void autoSaveRef.current();
        },
      },
    });
  }

  function canSaveDraft() {
    if (k !== "categories") return true;
    const categories = draftRef.current as { name?: string }[];
    return categories.every(
      (category) => typeof category.name === "string" && category.name.trim().length > 0,
    );
  }

  async function saveAutomatically() {
    if (savingRef.current) {
      if (draftVersion.current > inFlightVersion.current) saveAgain.current = true;
      return;
    }

    if (draftVersion.current <= lastSavedVersion.current) return;

    if (!canSaveDraft()) {
      showSaveError("Cada categoría necesita un nombre válido antes de guardar.");
      return;
    }

    const version = draftVersion.current;
    const data = structuredClone(draftRef.current);
    const imageUrls = [...uploadedUrlsRef.current];
    savingRef.current = true;
    inFlightVersion.current = version;
    saveStatus.current = "saving";
    saveToastId.current = toast.loading("Guardando cambios…", {
      id: saveToastId.current,
      duration: Infinity,
      action: null,
    });

    try {
      const result = await saveContent(k, data, imageUrls);
      lastSavedVersion.current = version;
      if (draftVersion.current === version) {
        updateContent(k, result.data);
        onSaved();
        saveStatus.current = "saved";
        saveToastId.current = result.cleanupPending
          ? toast.warning(
              `Cambios guardados, pero quedan ${result.cleanupPending} fotos pendientes de borrar en Cloudinary.`,
              { id: saveToastId.current, duration: 5000, action: null },
            )
          : toast.success("Cambios guardados", { id: saveToastId.current, duration: 3000, action: null });
      } else {
        saveAgain.current = true;
        showPendingToast();
      }
    } catch (error) {
      if (draftVersion.current !== version) {
        saveAgain.current = true;
        showPendingToast();
      } else {
        showSaveError(
          error instanceof Error
            ? error.message
            : "No se pudo guardar. Revisá la conexión e intentá de nuevo.",
        );
      }
    } finally {
      savingRef.current = false;
      if (saveAgain.current && lastSavedVersion.current < draftVersion.current) {
        saveAgain.current = false;
        window.setTimeout(() => void autoSaveRef.current(), k === "texts" ? 0 : 200);
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

  if (draft === null) return <AdminSectionSkeleton section={k === "contact" ? "instagram" : k} />;

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
