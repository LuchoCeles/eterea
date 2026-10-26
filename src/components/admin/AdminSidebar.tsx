"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Images,
  Instagram,
  Megaphone,
  Package,
  PanelsTopLeft,
  Tags,
  Users,
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
  group: "Inicio" | "Catálogo" | "Contacto";
  icon: LucideIcon;
}[] = [
  {
    id: "texts",
    slug: "contenido",
    label: "Diseño del inicio",
    shortLabel: "Inicio",
    description: "Secciones, tarjetas destacadas, textos y fotos del home.",
    group: "Inicio",
    icon: Images,
  },
  {
    id: "promo",
    slug: "promociones",
    label: "Promociones",
    shortLabel: "Promos",
    description: "Mensajes que aparecen en la tienda.",
    group: "Inicio",
    icon: Megaphone,
  },
  {
    id: "hero",
    slug: "banners",
    label: "Banners",
    shortLabel: "Banners",
    description: "Imágenes y textos destacados.",
    group: "Inicio",
    icon: PanelsTopLeft,
  },
  {
    id: "products",
    slug: "productos",
    label: "Productos",
    shortLabel: "Prendas",
    description: "Prendas, precios y categorías.",
    group: "Catálogo",
    icon: Package,
  },
  {
    id: "categories",
    slug: "categorias",
    label: "Categorías",
    shortLabel: "Categorías",
    description: "Agrupá productos y definí los filtros del catálogo.",
    group: "Catálogo",
    icon: Tags,
  },
  {
    id: "instagram",
    slug: "redes-y-contacto",
    label: "Redes y contacto",
    shortLabel: "Redes",
    description: "Instagram y datos de contacto.",
    group: "Contacto",
    icon: Instagram,
  },
];

export function AdminSidebar({ activeSection, pendingSections = [], owner }: { activeSection?: ContentKey; pendingSections?: ContentKey[]; owner: boolean }) {
  const pathname = usePathname();
  const currentSection =
    activeSection ?? adminSections.find((section) => pathname === `/admin/${section.slug}`)?.id;

  return (
    <aside className="admin-tabbar absolute inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom))] z-30 mx-auto max-w-[430px] rounded-[26px] border p-1.5 sm:static sm:order-first sm:mx-0 sm:w-[205px] sm:max-w-none sm:shrink-0 sm:rounded-none sm:border-0 sm:border-r sm:border-border sm:bg-card/25 sm:px-3 sm:py-6 lg:w-[210px]">
      <p className="mb-4 hidden px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:block">
        Administración
      </p>
      <nav
        id="admin-navigation"
        aria-label="Navegación principal"
        className={`grid ${owner ? "grid-cols-7" : "grid-cols-6"} gap-1 sm:flex sm:flex-col sm:gap-2`}
      >
        {adminSections.map(({ id, slug, label, shortLabel, group, icon: Icon }, index) => {
          const active = currentSection === id;
          const pending = pendingSections.includes(id);
          return (
            <Fragment key={id}>
              {(index === 0 || adminSections[index - 1].group !== group) && <p className="mt-4 hidden px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground first:mt-0 sm:block">{group}</p>}
              <Link
                href={`/admin/${slug}`}
                prefetch={false}
                title={pending ? label + " · Cambios sin guardar" : label}
                aria-label={pending ? label + ", con cambios sin guardar" : label}
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
                {pending && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-500 sm:right-3 sm:top-3" aria-hidden="true" />}
                <span className="w-full truncate text-[10px] leading-tight sm:hidden">
                  {shortLabel}
                </span>
                <span className="hidden truncate text-sm sm:block">{label}</span>
              </Link>
            </Fragment>
          );
        })}
        {owner && (
          <Fragment>
            <p className="mt-4 hidden px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:block">Cuenta</p>
            <Link href="/admin/usuarios" prefetch={false} aria-current={pathname === "/admin/usuarios" ? "page" : undefined}
              className={clsx("relative flex min-h-[62px] min-w-0 flex-col items-center justify-center gap-1 rounded-[19px] px-1 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:min-h-[52px] sm:flex-row sm:justify-start sm:gap-3 sm:rounded-xl sm:px-3 sm:text-left lg:px-4", pathname === "/admin/usuarios" ? "admin-nav-active font-semibold" : "font-medium text-muted-foreground hover:bg-secondary/55 hover:text-foreground")}>
              {pathname === "/admin/usuarios" && <span className="absolute inset-y-3 left-0 hidden w-[3px] rounded-r-full bg-primary sm:block" aria-hidden="true" />}
              <Users className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" strokeWidth={pathname === "/admin/usuarios" ? 2 : 1.7} aria-hidden="true" />
              <span className="w-full truncate text-[10px] leading-tight sm:hidden">Usuarios</span>
              <span className="hidden truncate text-sm sm:block">Usuarios</span>
            </Link>
          </Fragment>
        )}
      </nav>
    </aside>
  );
}
