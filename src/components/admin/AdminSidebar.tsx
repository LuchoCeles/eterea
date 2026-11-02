"use client";

import { Fragment, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Images,
  Instagram,
  Megaphone,
  Package,
  PanelsTopLeft,
  ShoppingBag,
  Tags,
  Truck,
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
  group: "Inicio" | "Catálogo" | "Tienda" | "Contacto";
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
    id: "howToBuy",
    slug: "como-comprar",
    label: "Cómo comprar",
    shortLabel: "Comprar",
    description: "Pasos y condiciones para realizar una compra en la tienda.",
    group: "Tienda",
    icon: ShoppingBag,
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
  const navigationRef = useRef<HTMLElement>(null);
  const currentSection =
    activeSection ?? adminSections.find((section) => pathname === `/admin/${section.slug}`)?.id;

  useEffect(() => {
    const navigation = navigationRef.current;
    if (navigation && navigation.scrollWidth > navigation.clientWidth) {
      navigation.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest", inline: "center" });
    }
  }, [pathname, currentSection]);

  return (
    <aside className="admin-tabbar absolute inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom))] z-30 mx-auto max-w-[430px] rounded-[26px] border p-1.5 sm:max-w-[640px] admin-desktop:static admin-desktop:order-first admin-desktop:mx-0 admin-desktop:w-[210px] admin-desktop:max-w-none admin-desktop:shrink-0 admin-desktop:rounded-none admin-desktop:border-0 admin-desktop:border-r admin-desktop:border-border admin-desktop:bg-card/25 admin-desktop:px-3 admin-desktop:py-6">
      <p className="mb-4 hidden px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground admin-desktop:block">
        Administración
      </p>
      <nav
        ref={navigationRef}
        id="admin-navigation"
        aria-label="Navegación principal"
        className="flex gap-1 overflow-x-auto overscroll-x-contain admin-desktop:flex-col admin-desktop:gap-2 admin-desktop:overflow-visible"
      >
        {adminSections.map(({ id, slug, label, shortLabel, group, icon: Icon }, index) => {
          const active = currentSection === id;
          const pending = pendingSections.includes(id);
          return (
            <Fragment key={id}>
              {(index === 0 || adminSections[index - 1].group !== group) && <p className="mt-4 hidden px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground first:mt-0 admin-desktop:block">{group}</p>}
              <Link
                href={`/admin/${slug}`}
                prefetch={false}
                title={pending ? label + " · Cambios sin guardar" : label}
                aria-label={pending ? label + ", con cambios sin guardar" : label}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "admin-nav-link relative flex min-h-[62px] min-w-0 flex-[1_0_68px] flex-col items-center justify-center gap-1 rounded-[19px] px-1 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring admin-desktop:min-h-[52px] admin-desktop:flex-none admin-desktop:flex-row admin-desktop:justify-start admin-desktop:gap-3 admin-desktop:rounded-xl admin-desktop:px-4 admin-desktop:text-left",
                  active
                    ? "admin-nav-active font-semibold"
                    : "font-medium text-muted-foreground hover:bg-secondary/55 hover:text-foreground",
                )}
              >
                {active && (
                  <span
                    className="absolute inset-y-3 left-0 hidden w-[3px] rounded-r-full bg-primary admin-desktop:block"
                    aria-hidden="true"
                  />
                )}
                <Icon
                  className="h-5 w-5 shrink-0 admin-desktop:h-6 admin-desktop:w-6"
                  strokeWidth={active ? 2 : 1.7}
                  aria-hidden="true"
                />
                {pending && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-500 admin-desktop:right-3 admin-desktop:top-3" aria-hidden="true" />}
                <span className="w-full truncate text-[10px] leading-tight admin-desktop:hidden">
                  {shortLabel}
                </span>
                <span className="hidden truncate text-sm admin-desktop:block">{label}</span>
              </Link>
            </Fragment>
          );
        })}
        <Fragment>
          <p className="mt-4 hidden px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground admin-desktop:block">Envíos</p>
          <Link href="/admin/envios" prefetch={false} aria-current={pathname === "/admin/envios" ? "page" : undefined}
            className={clsx("admin-nav-link relative flex min-h-[62px] min-w-0 flex-[1_0_68px] flex-col items-center justify-center gap-1 rounded-[19px] px-1 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring admin-desktop:min-h-[52px] admin-desktop:flex-none admin-desktop:flex-row admin-desktop:justify-start admin-desktop:gap-3 admin-desktop:rounded-xl admin-desktop:px-4 admin-desktop:text-left", pathname === "/admin/envios" ? "admin-nav-active font-semibold" : "font-medium text-muted-foreground hover:bg-secondary/55 hover:text-foreground")}>
            {pathname === "/admin/envios" && <span className="absolute inset-y-3 left-0 hidden w-[3px] rounded-r-full bg-primary admin-desktop:block" aria-hidden="true" />}
            <Truck className="h-5 w-5 shrink-0 admin-desktop:h-6 admin-desktop:w-6" strokeWidth={pathname === "/admin/envios" ? 2 : 1.7} aria-hidden="true" />
            <span className="w-full truncate text-[10px] leading-tight admin-desktop:hidden">Envíos</span>
            <span className="hidden truncate text-sm admin-desktop:block">Envíos</span>
          </Link>
        </Fragment>
        <Fragment>
          <p className="mt-4 hidden px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground admin-desktop:block">Cuenta</p>
          <Link href="/admin/usuarios" prefetch={false} aria-current={pathname === "/admin/usuarios" ? "page" : undefined}
            className={clsx("admin-nav-link relative flex min-h-[62px] min-w-0 flex-[1_0_68px] flex-col items-center justify-center gap-1 rounded-[19px] px-1 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring admin-desktop:min-h-[52px] admin-desktop:flex-none admin-desktop:flex-row admin-desktop:justify-start admin-desktop:gap-3 admin-desktop:rounded-xl admin-desktop:px-4 admin-desktop:text-left", pathname === "/admin/usuarios" ? "admin-nav-active font-semibold" : "font-medium text-muted-foreground hover:bg-secondary/55 hover:text-foreground")}>
            {pathname === "/admin/usuarios" && <span className="absolute inset-y-3 left-0 hidden w-[3px] rounded-r-full bg-primary admin-desktop:block" aria-hidden="true" />}
            <Users className="h-5 w-5 shrink-0 admin-desktop:h-6 admin-desktop:w-6" strokeWidth={pathname === "/admin/usuarios" ? 2 : 1.7} aria-hidden="true" />
            <span className="w-full truncate text-[10px] leading-tight admin-desktop:hidden">{owner ? "Usuarios" : "Mi cuenta"}</span>
            <span className="hidden truncate text-sm admin-desktop:block">{owner ? "Usuarios" : "Mi cuenta"}</span>
          </Link>
        </Fragment>
      </nav>
    </aside>
  );
}
