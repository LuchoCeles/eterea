"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebar, adminSections } from "@/components/admin/AdminSidebar";
import { AdminContentEditor } from "@/components/admin/AdminContentEditors";
import {
  AdminSaveProvider,
  hasUnsavedChanges,
  useAdminSave,
} from "@/components/admin/AdminSaveProvider";
import { AdminSectionSkeleton } from "@/components/loading/AdminSectionSkeleton";
import { useContent } from "@/components/providers/ContentProvider";
import type { ContentKey, StoreProduct } from "@/lib/content";

type AdminTheme = "light" | "dark";
const ADMIN_THEME_STORAGE_KEY = "eterea-admin-theme";
const ADMIN_SECTION_STORAGE_KEY = "eterea-admin-section";

export function AdminEditor({ email, children }: { email: string; children: ReactNode }) {
  return (
    <AdminSaveProvider>
      <AdminEditorShell email={email}>{children}</AdminEditorShell>
    </AdminSaveProvider>
  );
}

function AdminEditorShell({ email, children }: { email: string; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const contentRef = useRef<HTMLElement>(null);
  const [theme, setTheme] = useState<AdminTheme>("dark");
  const { drafts, textDrafts, hasPendingChanges } = useAdminSave();
  const activeSection = adminSections.find((section) => pathname === "/admin/" + section.slug)?.id;
  const pendingSections = adminSections
    .filter((section) => {
      const entry = drafts[section.id];
      return (
        hasUnsavedChanges(entry) ||
        (section.id === "texts" && Object.values(textDrafts).some(hasUnsavedChanges))
      );
    })
    .map((section) => section.id);

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

  function confirmLeaving() {
    return (
      !hasPendingChanges() ||
      window.confirm("Hay cambios sin guardar. ¿Querés salir y descartarlos?")
    );
  }

  function handleLinkClick(event: MouseEvent<HTMLDivElement>) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest<HTMLAnchorElement>("a[href]");
    if (
      !link ||
      link.getAttribute("href")?.startsWith("/admin") ||
      link.target === "_blank" ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    if (!confirmLeaving()) event.preventDefault();
  }

  async function signOut() {
    if (!confirmLeaving()) return;
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/auth");
    router.refresh();
  }

  return (
    <div
      className="admin-theme flex h-dvh min-h-[480px] flex-col bg-background text-foreground"
      onClickCapture={handleLinkClick}
    >
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
          <AdminSidebar activeSection={activeSection} pendingSections={pendingSections} />
        </div>
      </div>
    </div>
  );
}

export function AdminSectionEditor({ section }: { section: ContentKey }) {
  const currentSection = adminSections.find((item) => item.id === section);
  const fillsPanel = section === "categories" || section === "products";

  return (
    <div className={fillsPanel ? "w-full" : "mx-auto max-w-[1120px]"}>
      <Editor
        k={section}
        label={currentSection?.label ?? ""}
        description={currentSection?.description ?? ""}
      />
    </div>
  );
}

function Editor({ k, label, description }: { k: ContentKey; label: string; description: string }) {
  const value = useContent(k);
  const { drafts, change, uploaded, save, saveData } = useAdminSave();
  const entry = drafts[k];
  const draft = entry?.data ?? value;
  const dirty = hasUnsavedChanges(entry);
  const saving = entry?.saving === true;
  const postsOnly = k === "instagram";

  if (draft === null) return <AdminSectionSkeleton section={k === "contact" ? "instagram" : k} />;

  return (
    <div>
      <div className="sticky top-0 z-20 -mx-5 mb-7 flex flex-wrap items-center justify-between gap-4 bg-background/95 px-5 py-4 backdrop-blur-xl sm:-mx-7 sm:mb-8 sm:px-7 lg:-mx-10 lg:px-10 xl:-mx-12 xl:px-12">
        <div className="min-w-0 flex-1 py-1">
          <h2 className="truncate font-display text-[28px] font-semibold leading-tight sm:text-[38px]">
            {label}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground sm:mt-2 sm:text-base">{description}</p>
        </div>
        {k !== "texts" && (dirty || saving) && (
          <button
            type="button"
            onClick={() => void save(k, value)}
            disabled={saving}
            className="admin-save-button inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {postsOnly ? "Guardar publicaciones" : "Guardar cambios"}
          </button>
        )}
      </div>
      <AdminContentEditor
        k={k}
        draft={draft}
        onChange={(next) => change(k, value, next)}
        onUploaded={(urls) => uploaded(k, value, urls)}
        onSaveProduct={
          k === "products"
            ? (products: StoreProduct[], urls: string[]) => saveData(k, value, products, urls)
            : undefined
        }
      />
    </div>
  );
}
