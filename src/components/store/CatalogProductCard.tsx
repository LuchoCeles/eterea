"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useContent } from "@/components/providers/ContentProvider";
import { AddToCartButton } from "@/components/store/AddToCartButton";
import { ProductCardPrice } from "@/components/store/ProductCardPrice";
import { ProductImage } from "@/components/store/ProductImage";
import type { StoreProduct } from "@/lib/content";
import { isProductSoldOut, type Product } from "@/lib/products";
import { productHref } from "@/lib/product-slugs";
import { automaticProductTag } from "@/lib/storefront-rules";

export function CatalogProductCard({ product, onAdd }: { product: StoreProduct; onAdd: (product: Product) => void }) {
  const allProducts = useContent("products");
  const offersEnabled = useContent("texts").offers.enabled;
  const tag = automaticProductTag(product, offersEnabled);
  const needsSelection = !!(product.sizes?.length || product.colors?.length);
  const unavailable = isProductSoldOut(product);
  const href = productHref(product, allProducts);

  return (
    <article className="group flex h-full min-w-0 flex-col">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#edeae2]">
        <Link href={href} aria-label={`Ver ${product.name}`} draggable={false} className="block h-full w-full">
          <ProductImage src={product.image} alt={product.name} presentation={product.coverSettings} cover loading="lazy" sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className={`h-full w-full transition-transform duration-700 group-hover:scale-105 ${product.coverSettings ? "object-contain" : "object-cover"}`} />
        </Link>
        {(unavailable || tag) && (
          <span className={`eyebrow absolute left-3 top-3 px-3 py-1.5 ${unavailable ? "bg-muted text-muted-foreground" : tag === "Oferta" ? "bg-accent text-accent-foreground" : "bg-background text-foreground"}`}>
            {unavailable ? "Agotada" : tag}
          </span>
        )}
        {unavailable ? <Link href={href} draggable={false} className="absolute inset-x-3 bottom-3 flex h-11 cursor-not-allowed items-center justify-center gap-2 bg-muted text-sm text-muted-foreground md:translate-y-3 md:opacity-0 md:transition-all md:group-hover:translate-y-0 md:group-hover:opacity-100 md:focus-visible:translate-y-0 md:focus-visible:opacity-100">Agotada</Link> : needsSelection ? <Link href={href} draggable={false} className="absolute inset-x-3 bottom-3 flex h-11 items-center justify-center gap-2 bg-primary text-sm text-primary-foreground md:translate-y-3 md:opacity-0 md:transition-all md:group-hover:translate-y-0 md:group-hover:opacity-100 md:focus-visible:translate-y-0 md:focus-visible:opacity-100">Elegir talle y color <ArrowUpRight className="h-4 w-4" /></Link> : <AddToCartButton
          product={product}
          onAdd={onAdd}
          className="absolute inset-x-3 bottom-3 h-11 rounded-none bg-primary text-primary-foreground md:translate-y-3 md:opacity-0 md:transition-all md:group-hover:translate-y-0 md:group-hover:opacity-100 md:focus-visible:translate-y-0 md:focus-visible:opacity-100"
        />}
      </div>

      <div className="flex-1 border-b px-1 pb-4 pt-4">
        <p className="eyebrow text-muted-foreground">{product.category}</p>
        <h2 className="mt-1 font-sans text-sm font-medium tracking-normal"><Link href={href} draggable={false} className="hover:text-accent">{product.name}</Link></h2>
        <ProductCardPrice product={product} />
      </div>
    </article>
  );
}
