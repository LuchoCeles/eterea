"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Product } from "@/lib/products";
import type { StoreProduct } from "@/lib/content";
import { AddToCartButton } from "@/components/store/AddToCartButton";
import { ProductImage } from "@/components/store/ProductImage";
import { ProductCardPrice } from "@/components/store/ProductCardPrice";
import { useContent } from "@/components/providers/ContentProvider";
import { productHref } from "@/lib/product-slugs";
import { automaticProductTag } from "@/lib/storefront-rules";

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
  products: StoreProduct[];
  onAdd: (product: Product) => void;
}) {
  const [carouselRef, carouselApi] = useEmblaCarousel({
    loop: products.length > 1,
    align: "start",
    slidesToScroll: 1,
  });
  const sectionRef = useRef<HTMLElement>(null);
  const allProducts = useContent("products");
  const offersEnabled = useContent("texts").offers.enabled;
  const canNavigate = products.length > 1;
  // Embla necesita suficientes tarjetas para mantener el bucle en pantallas anchas.
  const repeatedProducts = Array.from(
    { length: canNavigate ? Math.ceil(10 / products.length) : 1 },
    (_, group) => products.map((product) => ({ product, key: `${group}-${product.id}` })),
  ).flat();

  useEffect(() => {
    if (!carouselApi || !canNavigate) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const canHover = window.matchMedia("(hover: hover)");
    const timer = window.setInterval(() => {
      if (
        document.visibilityState !== "visible" ||
        reducedMotion.matches ||
        sectionRef.current?.matches(":focus-within") ||
        (canHover.matches && sectionRef.current?.matches(":hover"))
      )
        return;
      carouselApi.scrollNext();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [carouselApi, canNavigate]);

  return (
    <section
      ref={sectionRef}
      id={id}
      className="mx-auto max-w-[1600px] px-4 py-20 md:px-8"
      aria-label={title}
    >
      <div className="mb-8 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <span className="eyebrow text-muted-foreground">{kicker}</span>
          <h2 className="mt-3 text-3xl font-normal md:text-5xl">{title}</h2>
        </div>
      </div>
      <div className="relative">
        <div
          ref={carouselRef}
          className="overflow-hidden"
          aria-roledescription="carrusel"
          aria-live="off"
        >
          {/* El espacio integra cada slide para que Embla lo conserve al cerrar el bucle. */}
          <div className="flex">
            {repeatedProducts.map(({ product: p, key }) => {
              const href = productHref(p, allProducts);
              const unavailable =
                !!p.soldOut ||
                !!(p.colors?.length && p.colors.every((color) => p.soldOutColors?.includes(color)));
              const tag = automaticProductTag(p, offersEnabled);
              return (
                <article
                  key={key}
                  className="group min-w-0 basis-[calc(70%_+_1rem)] shrink-0 grow-0 pr-4 sm:basis-[calc(42%_+_1rem)] lg:basis-[calc(23.5%_+_1rem)]"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-card">
                    <Link
                      href={href}
                      aria-label={`Ver ${p.name}`}
                      draggable={false}
                      className="block h-full w-full"
                    >
                      <ProductImage
                        src={p.image}
                        alt={p.name}
                        loading="lazy"
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 42vw, 70vw"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </Link>
                    {(unavailable || tag) && (
                      <span
                        className={`eyebrow absolute left-3 top-3 px-2.5 py-1 ${unavailable ? "bg-muted text-muted-foreground" : tag === "Oferta" ? "bg-accent text-accent-foreground" : "bg-background text-foreground"}`}
                      >
                        {unavailable ? "Agotada" : tag}
                      </span>
                    )}
                    {unavailable ? (
                      <Link
                        href={href}
                        draggable={false}
                        className="absolute inset-x-3 bottom-3 flex h-11 items-center justify-center bg-muted text-sm text-muted-foreground transition-all md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:focus-visible:translate-y-0 md:focus-visible:opacity-100"
                      >
                        Ver prenda agotada
                      </Link>
                    ) : p.sizes?.length || p.colors?.length ? (
                      <Link
                        href={href}
                        draggable={false}
                        className="absolute inset-x-3 bottom-3 flex h-11 items-center justify-center bg-primary text-sm text-primary-foreground transition-all md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:focus-visible:translate-y-0 md:focus-visible:opacity-100"
                      >
                        Elegir talle y color
                      </Link>
                    ) : (
                      <AddToCartButton
                        product={p}
                        onAdd={onAdd}
                        className="absolute inset-x-3 bottom-3 h-11 rounded-none bg-primary py-3 text-sm text-primary-foreground transition-all md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:focus-visible:translate-y-0 md:focus-visible:opacity-100"
                      />
                    )}
                  </div>
                  <div className="mt-3 min-w-0">
                    <p className="text-xs text-muted-foreground">{p.category}</p>
                    <h3 className="mt-0.5 font-sans text-[15px] font-medium tracking-normal">
                      <Link href={href} draggable={false} className="hover:text-accent">
                        {p.name}
                      </Link>
                    </h3>
                    <ProductCardPrice product={p} />
                  </div>
                </article>
              );
            })}
          </div>
        </div>
        {canNavigate && (
          <>
            <div className="pointer-events-none absolute left-0 top-0 hidden aspect-[4/5] w-[42%] md:block lg:w-[23.5%]">
              <button
                type="button"
                onClick={() => carouselApi?.scrollPrev()}
                aria-label={`Ver prendas anteriores de ${title}`}
                className="pointer-events-auto flex h-full w-20 items-center justify-start bg-gradient-to-r from-background/55 via-background/15 to-transparent pl-4 text-foreground transition-colors hover:from-background/75 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-foreground"
              >
                <ArrowLeft className="h-5 w-5 drop-shadow-sm" aria-hidden="true" />
              </button>
            </div>
            <div className="pointer-events-none absolute right-0 top-0 hidden aspect-[4/5] w-[42%] md:block lg:w-[23.5%]">
              <button
                type="button"
                onClick={() => carouselApi?.scrollNext()}
                aria-label={`Ver prendas siguientes de ${title}`}
                className="pointer-events-auto ml-auto flex h-full w-20 items-center justify-end bg-gradient-to-l from-background/55 via-background/15 to-transparent pr-4 text-foreground transition-colors hover:from-background/75 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-foreground"
              >
                <ArrowRight className="h-5 w-5 drop-shadow-sm" aria-hidden="true" />
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
