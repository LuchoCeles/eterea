"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  slug: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    id: "promo",
    slug: "promociones",
    label: "Promociones",
    shortLabel: "Promos",
    description: "Mensajes que aparecen en la tienda.",
    icon: Megaphone,
  },
  {
    id: "hero",
    slug: "banners",
    label: "Banners",
    shortLabel: "Banners",
    description: "Imágenes y textos destacados.",
    icon: PanelsTopLeft,
  },
  {
    id: "categories",
    slug: "categorias",
    label: "Categorías",
    shortLabel: "Categorías",
    description: "Creá y editá las categorías de la tienda.",
    icon: Tags,
  },
  {
    id: "products",
    slug: "productos",
    label: "Productos",
    shortLabel: "Prendas",
    description: "Prendas, precios y categorías.",
    icon: Package,
  },
  {
    id: "texts",
    slug: "textos-y-fotos",
    label: "Textos y fotos",
    shortLabel: "Textos",
    description: "Secciones y contenido de la tienda.",
    icon: Images,
  },
  {
    id: "instagram",
    slug: "redes-y-contacto",
    label: "Redes y contacto",
    shortLabel: "Redes",
    description: "Instagram y datos de contacto.",
    icon: Instagram,
  },
];

export function AdminSidebar({ activeSection }: { activeSection?: ContentKey }) {
  const pathname = usePathname();
  const currentSection =
    activeSection ?? adminSections.find((section) => pathname === `/admin/${section.slug}`)?.id;

  return (
    <aside className="admin-tabbar absolute inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom))] z-30 mx-auto max-w-[430px] rounded-[26px] border p-1.5 sm:static sm:order-first sm:mx-0 sm:w-[205px] sm:max-w-none sm:shrink-0 sm:rounded-none sm:border-0 sm:border-r sm:border-border sm:bg-card/25 sm:px-3 sm:py-6 lg:w-[210px]">
      <p className="mb-4 hidden px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:block">
        Contenido
      </p>
      <nav
        id="admin-navigation"
        aria-label="Navegación principal"
        className="grid grid-cols-6 gap-1 sm:flex sm:flex-col sm:gap-2"
      >
        {adminSections.map(({ id, slug, label, shortLabel, icon: Icon }) => {
          const active = currentSection === id;
          return (
            <Link
              key={id}
              href={`/admin/${slug}`}
              title={label}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "relative flex min-h-[62px] min-w-0 flex-col items-center justify-center gap-1 rounded-[19px] px-1 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:min-h-[52px] sm:flex-row sm:justify-start sm:gap-3 sm:rounded-xl sm:px-3 sm:text-left lg:px-4",
                active
                  ? "admin-nav-active font-semibold"
                  : "font-medium text-muted-foreground hover:bg-secondary/55 hover:text-foreground",
              )}
            >
              {active && (
                <span
                  className="absolute inset-y-3 left-0 hidden w-[3px] rounded-r-full bg-primary sm:block"
                  aria-hidden="true"
                />
              )}
              <Icon
                className="h-5 w-5 shrink-0 sm:h-6 sm:w-6"
                strokeWidth={active ? 2 : 1.7}
                aria-hidden="true"
              />
              <span className="w-full truncate text-[10px] leading-tight sm:hidden">
                {shortLabel}
              </span>
              <span className="hidden truncate text-sm sm:block">{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
