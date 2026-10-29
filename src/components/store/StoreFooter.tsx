"use client";

import Link from "next/link";
import { useContent } from "@/components/providers/ContentProvider";
import { instagramProfileUrl } from "@/lib/storefront-rules";
import { homeProducts } from "@/lib/catalog-products";
import { visibleStoreProducts } from "@/lib/content";

const logo = "/assets/eterea-placeholder.svg";

export function StoreFooter() {
  const texts = useContent("texts");
  const contact = useContent("contact");
  const products = useContent("products");
  const categories = useContent("categories");
  const visibleProducts = visibleStoreProducts(products, categories);
  const { newArrivals, sale } = homeProducts(visibleProducts, texts.offers.enabled);
  const instagramUrl = instagramProfileUrl(contact.instagramUsername);
  const columns = [
    { title: "Tienda", links: [
      ...(texts.homeSections.newArrivals && newArrivals.length ? [{ name: "Lo nuevo", href: "/#nuevo" }] : []),
      { name: "Prendas", href: "/productos" },
      ...(texts.homeSections.sale && sale.length ? [{ name: "Descuentos", href: "/#descuentos" }] : []),
    ] },
    { title: "Etérea", links: [
      { name: "Quiénes somos", href: "/quienes-somos" },
      ...(texts.homeSections.instagram ? [{ name: "Instagram", href: "/#instagram" }] : []),
    ] },
    { title: "Contacto", links: instagramUrl ? [{ name: "Escribinos por Instagram", href: instagramUrl, external: true }] : [] },
  ];

  return (
    <footer className="bg-background">
      <div className="mx-auto grid max-w-[1600px] gap-10 px-4 py-14 md:grid-cols-4 md:px-8">
        <img src={logo} alt="Etérea New Concept" className="h-24 w-48 object-contain" />
        {columns.map((column) => (
          <div key={column.title}>
            <p className="eyebrow text-muted-foreground">{column.title}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {column.links.map((item) => (
                <li key={item.name}>
                  {"external" in item && item.external
                    ? <a href={item.href} target="_blank" rel="noopener noreferrer" className="hover:text-accent">{item.name}</a>
                    : <Link href={item.href} className="hover:text-accent">{item.name}</Link>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-xs text-muted-foreground md:px-8">
        <p>© 2026 Etérea New Concept</p>
        <img src="/assets/sticker-concha.webp" alt="" aria-hidden="true" width={512} height={459} loading="lazy" className="pointer-events-none h-12 w-14 object-contain" />
      </div>
    </footer>
  );
}
