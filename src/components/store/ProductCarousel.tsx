"use client";

import { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { formatPrice, type Product } from "@/lib/products";
import { Button } from "@/components/ui/button";
import { AddToCartButton } from "@/components/store/AddToCartButton";

export function ProductCarousel({
  id,
  kicker,
  title,
  products,
  onAdd,
}: {
  id?: string;
  kicker: string;
  title: string;
  products: Product[];
  onAdd: (product: Product) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (d: number) => ref.current?.scrollBy({ left: d * ref.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <section id={id} className="mx-auto max-w-[1600px] px-4 py-20 md:px-8">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <span className="eyebrow text-muted-foreground">{kicker}</span>
          <h2 className="mt-3 text-3xl font-normal md:text-5xl">{title}</h2>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="icon" onClick={() => scroll(-1)} aria-label="Prendas anteriores" className="h-10 w-10 rounded-none">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => scroll(1)} aria-label="Prendas siguientes" className="h-10 w-10 rounded-none">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div ref={ref} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        {products.map((p) => (
          <article key={p.id + p.name} className="group w-[70%] shrink-0 snap-start sm:w-[42%] lg:w-[23.5%]">
            <div className="relative aspect-[4/5] overflow-hidden bg-card">
              <img src={p.image} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              {p.tag && (
                <span className={`eyebrow absolute left-3 top-3 px-2.5 py-1 ${p.oldPrice ? "bg-accent text-accent-foreground" : "bg-background text-foreground"}`}>
                  {p.tag}
                </span>
              )}
              <AddToCartButton
                product={p}
                onAdd={onAdd}
                className="absolute inset-x-3 bottom-3 h-11 rounded-none bg-primary py-3 text-sm text-primary-foreground transition-all md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:focus-visible:translate-y-0 md:focus-visible:opacity-100"
              />
            </div>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{p.category}</p>
                <h3 className="mt-0.5 font-sans text-[15px] font-medium tracking-normal">{p.name}</h3>
              </div>
              <div className="text-right text-sm">
                <p className={p.oldPrice ? "text-accent" : ""}>{formatPrice(p.price)}</p>
                {p.oldPrice && <p className="text-xs text-muted-foreground line-through">{formatPrice(p.oldPrice)}</p>}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
