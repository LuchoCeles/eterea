"use client";

import { AddToCartButton } from "@/components/store/AddToCartButton";
import { ProductImage } from "@/components/store/ProductImage";
import { formatPrice, type Product } from "@/lib/products";
import { hasRealDiscount, visiblePaymentPrices } from "@/lib/storefront-rules";

export function CatalogProductCard({ product, onAdd, offersEnabled }: { product: Product; onAdd: (product: Product) => void; offersEnabled: boolean }) {
  const discounted = hasRealDiscount(product);
  const discount = discounted ? Math.round((1 - product.price / (product.oldPrice ?? product.price)) * 100) : 0;
  const paymentPrices = visiblePaymentPrices(product.paymentPrices ?? [], offersEnabled);

  return (
    <article className="group min-w-0">
      <div className="relative aspect-[4/5] overflow-hidden bg-card">
        <ProductImage src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        {(discounted || product.tag) && (
          <span className={`eyebrow absolute left-3 top-3 px-3 py-1.5 ${discounted ? "bg-accent text-accent-foreground" : "bg-background text-foreground"}`}>
            {discounted ? `−${discount}%` : product.tag}
          </span>
        )}
        <AddToCartButton
          product={product}
          onAdd={onAdd}
          className="absolute inset-x-3 bottom-3 h-11 rounded-none bg-primary text-primary-foreground md:translate-y-3 md:opacity-0 md:transition-all md:group-hover:translate-y-0 md:group-hover:opacity-100 md:focus-visible:translate-y-0 md:focus-visible:opacity-100"
        />
      </div>

      <div className="border-b px-1 pb-4 pt-4">
        <p className="eyebrow text-muted-foreground">{product.category}</p>
        <h2 className="mt-1 font-sans text-sm font-medium tracking-normal">{product.name}</h2>
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
