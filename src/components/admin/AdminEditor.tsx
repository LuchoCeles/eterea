"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebar, adminSections } from "@/components/admin/AdminSidebar";
import { AdminContentEditor } from "@/components/admin/AdminContentEditors";
import { useContent, useContentUpdater, saveContent } from "@/components/providers/ContentProvider";
import type { ContentKey } from "@/lib/content";

type AdminTheme = "light" | "dark";
const ADMIN_THEME_STORAGE_KEY = "eterea-admin-theme";

export function AdminEditor({ email }: { email: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<ContentKey>("hero");
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
    const savedTheme = window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY);
    if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme);
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
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-10 pt-5 focus:outline-none sm:px-7 sm:pt-8 lg:px-10 lg:pt-10 xl:px-12"
          >
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
          </main>
          <AdminSidebar activeSection={tab} onSelect={selectSection} />
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
  const [saving, setSaving] = useState(false);

  useEffect(() => setDraft(structuredClone(value)), [value]);

  if (draft === null) return <p className="text-muted-foreground">Cargando…</p>;

  async function save() {
    setSaving(true);
    try {
      const result = await saveContent(k, draft, uploadedUrls);
      updateContent(k, draft);
      onSaved();
      if (result.cleanupPending)
        toast.error(
          `Se guardaron los cambios, pero quedan ${result.cleanupPending} fotos pendientes de borrar en Cloudinary. Volvé a guardar para reintentar.`,
        );
      else toast.success("Cambios guardados");
    } catch {
      toast.error("No se pudo guardar. Revisá la conexión e intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="sticky top-0 z-20 -mx-5 mb-7 flex items-center justify-between gap-4 bg-background/95 px-5 pb-5 pt-1 backdrop-blur-xl sm:-mx-7 sm:mb-8 sm:px-7 lg:-mx-10 lg:px-10 xl:-mx-12 xl:px-12">
        <div className="min-w-0 py-1">
          <h2 className="truncate font-display text-[28px] font-semibold leading-tight sm:text-[38px]">
            {label}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground sm:mt-2 sm:text-base">{description}</p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          aria-label="Guardar cambios"
          className="admin-save-button flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 sm:min-h-[54px] sm:px-7 sm:text-base"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          Guardar
        </button>
      </div>
      <AdminContentEditor k={k} draft={draft} onChange={setDraft} onUploaded={onUploaded} />
    </div>
  );
}
