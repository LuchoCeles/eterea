"use client";

import {
  Images,
  Instagram,
  Megaphone,
  Package,
  PanelsTopLeft,
  Tags,
  type LucideIcon,
} from "lucide-react";
import clsx from "clsx";
import type { ContentKey } from "@/lib/content";

export const adminSections: {
  id: ContentKey;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    id: "promo",
    label: "Promociones",
    shortLabel: "Promos",
    description: "Mensajes que aparecen en la tienda.",
    icon: Megaphone,
  },
  {
    id: "hero",
    label: "Banners",
    shortLabel: "Banners",
    description: "Imágenes y textos destacados.",
    icon: PanelsTopLeft,
  },
  {
    id: "categories",
    label: "Categorías",
    shortLabel: "Categorías",
    description: "Creá y editá las categorías de la tienda.",
    icon: Tags,
  },
  {
    id: "products",
    label: "Productos",
    shortLabel: "Prendas",
    description: "Prendas, precios y categorías.",
    icon: Package,
  },
  {
    id: "texts",
    label: "Textos y fotos",
    shortLabel: "Textos",
    description: "Secciones y contenido de la tienda.",
    icon: Images,
  },
  {
    id: "instagram",
    label: "Redes y contacto",
    shortLabel: "Redes",
    description: "Instagram y datos de contacto.",
    icon: Instagram,
  },
];

export function AdminSidebar({
  activeSection,
  onSelect,
}: {
  activeSection: ContentKey;
  onSelect: (section: ContentKey) => void;
}) {
  return (
    <aside className="z-30 shrink-0 border-t border-border bg-background/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:order-first sm:w-[205px] sm:border-r sm:border-t-0 sm:bg-card/25 sm:px-3 sm:py-6 sm:backdrop-blur-none lg:w-[210px]">
      <p className="mb-4 hidden px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:block">
        Contenido
      </p>
      <nav
        id="admin-navigation"
        aria-label="Navegación principal"
        className="mx-auto grid max-w-[780px] grid-cols-6 gap-1 py-2 sm:flex sm:flex-col sm:gap-2 sm:py-0"
      >
        {adminSections.map(({ id, label, shortLabel, icon: Icon }) => {
          const active = activeSection === id;
          return (
            <button
              key={id}
              type="button"
              title={label}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              aria-controls="admin-content"
              onClick={() => onSelect(id)}
              className={clsx(
                "relative flex min-h-[66px] min-w-0 flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl px-1 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:min-h-[52px] sm:flex-row sm:justify-start sm:gap-3 sm:rounded-xl sm:px-3 sm:text-left lg:px-4",
                active
                  ? "admin-nav-active font-semibold"
                  : "font-medium text-muted-foreground hover:bg-secondary/55 hover:text-foreground",
              )}
            >
              {active && (
                <span
                  className="absolute inset-x-5 top-0 h-[3px] rounded-b-full bg-primary sm:inset-x-auto sm:inset-y-3 sm:left-0 sm:h-auto sm:w-[3px] sm:rounded-r-full"
                  aria-hidden="true"
                />
              )}
              <Icon
                className="h-6 w-6 shrink-0"
                strokeWidth={active ? 2 : 1.7}
                aria-hidden="true"
              />
              <span className="truncate text-[10px] leading-none sm:hidden">{shortLabel}</span>
              <span className="hidden truncate text-sm sm:block">{label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
