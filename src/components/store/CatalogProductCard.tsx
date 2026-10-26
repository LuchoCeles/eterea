"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useContent } from "@/components/providers/ContentProvider";
import { AddToCartButton } from "@/components/store/AddToCartButton";
import { ProductImage } from "@/components/store/ProductImage";
import { formatPrice, isProductSoldOut, type Product } from "@/lib/products";
import { productHref } from "@/lib/product-slugs";
import { hasRealDiscount, visiblePaymentPrices } from "@/lib/storefront-rules";

export function CatalogProductCard({ product, onAdd, offersEnabled }: { product: Product; onAdd: (product: Product) => void; offersEnabled: boolean }) {
  const allProducts = useContent("products");
  const discounted = hasRealDiscount(product);
  const discount = discounted ? Math.round((1 - product.price / (product.oldPrice ?? product.price)) * 100) : 0;
  const paymentPrices = visiblePaymentPrices(product.paymentPrices ?? [], offersEnabled);
  const needsSelection = !!(product.sizes?.length || product.colors?.length);
  const unavailable = isProductSoldOut(product);
  const href = productHref(product, allProducts);

  return (
    <article className="group min-w-0">
      <div className="relative aspect-[4/5] overflow-hidden bg-card">
        <Link href={href} aria-label={`Ver ${product.name}`} draggable={false} className="block h-full w-full">
          <ProductImage src={product.image} alt={product.name} loading="lazy" sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </Link>
        {(unavailable || discounted || product.tag) && (
          <span className={`eyebrow absolute left-3 top-3 px-3 py-1.5 ${unavailable ? "bg-muted text-muted-foreground" : discounted ? "bg-accent text-accent-foreground" : "bg-background text-foreground"}`}>
            {unavailable ? "Agotada" : discounted ? `−${discount}%` : product.tag}
          </span>
        )}
        {unavailable ? <Link href={href} draggable={false} className="absolute inset-x-3 bottom-3 flex h-11 cursor-not-allowed items-center justify-center gap-2 bg-muted text-sm text-muted-foreground md:translate-y-3 md:opacity-0 md:transition-all md:group-hover:translate-y-0 md:group-hover:opacity-100 md:focus-visible:translate-y-0 md:focus-visible:opacity-100">Agotada</Link> : needsSelection ? <Link href={href} draggable={false} className="absolute inset-x-3 bottom-3 flex h-11 items-center justify-center gap-2 bg-primary text-sm text-primary-foreground md:translate-y-3 md:opacity-0 md:transition-all md:group-hover:translate-y-0 md:group-hover:opacity-100 md:focus-visible:translate-y-0 md:focus-visible:opacity-100">Elegir talle y color <ArrowUpRight className="h-4 w-4" /></Link> : <AddToCartButton
          product={product}
          onAdd={onAdd}
          className="absolute inset-x-3 bottom-3 h-11 rounded-none bg-primary text-primary-foreground md:translate-y-3 md:opacity-0 md:transition-all md:group-hover:translate-y-0 md:group-hover:opacity-100 md:focus-visible:translate-y-0 md:focus-visible:opacity-100"
        />}
      </div>

      <div className="border-b px-1 pb-4 pt-4">
        <p className="eyebrow text-muted-foreground">{product.category}</p>
        <h2 className="mt-1 font-sans text-sm font-medium tracking-normal"><Link href={href} draggable={false} className="hover:text-accent">{product.name}</Link></h2>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <p className={`font-medium ${discounted ? "text-accent" : ""}`}>{formatPrice(product.price)}</p>
          {discounted && <p className="text-xs text-muted-foreground line-through">{formatPrice(product.oldPrice ?? product.price)}</p>}
        </div>

        {paymentPrices.length > 0 && (
          <div className="mt-3 space-y-1.5 border-t border-dashed pt-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Precios por forma de pago</p>
            {paymentPrices.map((payment, index) => (
              <p key={`${payment.label}-${index}`} className="flex justify-between gap-2 text-xs">
                <span className="text-muted-foreground">{payment.label}</span>
                <span className="shrink-0 font-medium">{formatPrice(payment.price)}</span>
              </p>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
