"use client";

import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { HeroCarousel } from "@/components/store/HeroCarousel";
import { ProductCarousel } from "@/components/store/ProductCarousel";
import { StoreFooter } from "@/components/store/StoreFooter";
import { useContent } from "@/components/providers/ContentProvider";
import { useCart } from "@/components/providers/CartProvider";
import { ProductImage } from "@/components/store/ProductImage";
import { ContactSection } from "@/components/store/ContactSection";
import { Button } from "@/components/ui/button";
import { instagramProfileUrl, productWithoutOffers, visibleSaleProducts } from "@/lib/storefront-rules";
import { resolveImageSource } from "@/lib/image-source";
import { visibleStoreProducts } from "@/lib/content";

export function Storefront({ instagramSection }: { instagramSection: ReactNode }) {
  const { add } = useCart();
  const T = useContent("texts");
  const contact = useContent("contact");
  const instagramUrl = instagramProfileUrl(contact.instagramUsername);
  const products = useContent("products");
  const categories = useContent("categories");
  const visibleProducts = visibleStoreProducts(products, categories);
  const homeSections = T.homeSections;
  const newArrivals = visibleProducts.filter((p) => p.section === "nuevo").map((p) => productWithoutOffers(p, T.offers.enabled));
  const sale = visibleSaleProducts(visibleProducts.filter((p) => p.section === "sale"), T.offers.enabled);
  const visibleHomeSections = { ...homeSections, newArrivals: homeSections.newArrivals && newArrivals.length > 0 };
  const homeCategoryCards = T.homeCategoryCards.filter((card) => !card.hidden).flatMap((card) => {
    const category = categories.find((item) => item.id === card.categoryId);
    return category && !category.hidden && visibleProducts.some((product) => product.categoryId === category.id) ? [{ ...card, category }] : [];
  });
  return (
    <div className="min-h-screen">
      <main>
        <HeroCarousel />

        {/* Categorías */}
        {homeSections.categories && homeCategoryCards.length > 0 && <section id="prendas" className="relative mx-auto max-w-[1600px] px-4 pt-16 md:px-8">
          <img src="/assets/sticker-flor.webp" alt="" aria-hidden="true" width={512} height={457} loading="lazy" className="pointer-events-none absolute right-3 top-1 z-10 h-auto w-12 select-none sm:right-8 sm:w-16 md:right-12 md:w-20" />
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <span className="eyebrow text-muted-foreground">Explorá la tienda</span>
              <h2 className="mt-2 font-display text-3xl md:text-4xl">Prendas por categoría</h2>
            </div>
            <a href="/productos" className="hidden items-center gap-2 text-sm hover:text-accent sm:inline-flex">Ver todas <ArrowUpRight className="h-4 w-4" /></a>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {homeCategoryCards.map((card) => (
              <a key={card.id} href={`/productos?categoria=${encodeURIComponent(card.category.id)}`} className="group relative block overflow-hidden bg-card">
                <ProductImage src={resolveImageSource(card, products)} alt="" loading="lazy" sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" className="aspect-[3/4] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-background/90 p-4">
                  <h3 className="font-display text-xl md:text-2xl">{card.category.name}</h3>
                  <ArrowUpRight className="h-5 w-5 shrink-0" />
                </div>
              </a>
            ))}
          </div>
        </section>}

        {visibleHomeSections.newArrivals && <ProductCarousel id="nuevo" kicker="Nuestra selección" title="Lo nuevo de esta semana" products={newArrivals} onAdd={add} />}

        {/* Banner promo partido */}
        {homeSections.offerBanners && T.offers.enabled && (T.offers.showSplit || T.offers.showClub) && <section className="mx-auto grid max-w-[1600px] gap-4 px-4 md:grid-cols-2 md:px-8">
          {T.offers.showSplit && T.split.big && <div className="relative min-h-[480px] overflow-hidden">
            <ProductImage src={resolveImageSource(T.split, products)} alt={T.split.sub} loading="lazy" sizes="(min-width: 768px) 50vw, 100vw" className="absolute inset-0 h-full w-full object-cover object-left" />
            <div className="absolute inset-0 flex flex-col justify-end p-8 text-primary-foreground md:p-12">
              <span className="eyebrow">{T.split.kicker}</span>
              <p className="mt-3 font-display text-7xl font-semibold leading-none md:text-9xl">{T.split.big}</p>
              <p className="mt-2 text-lg">{T.split.sub}</p>
              <a href="#descuentos" className="mt-6 w-fit border-b border-primary-foreground pb-1 text-sm">{T.split.cta}</a>
            </div>
          </div>}
          {T.offers.showClub && T.club.big && <div className="flex min-h-[480px] flex-col justify-between bg-olive p-8 text-primary-foreground md:p-12">
            <span className="eyebrow">{T.club.kicker}</span>
            <div>
              <p className="font-display text-7xl font-semibold leading-none md:text-9xl">{T.club.big}</p>
              <p className="mt-4 max-w-sm text-lg">{T.club.text}</p>
              {T.club.code && <p className="mt-4 inline-block border border-primary-foreground/60 px-4 py-2 font-display text-xl">{T.club.code}</p>}
            </div>
            <a href="#descuentos" className="w-fit bg-primary-foreground px-7 py-3.5 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground">
              {T.club.cta}
            </a>
          </div>}
        </section>}

        {homeSections.sale && sale.length > 0 && <ProductCarousel id="descuentos" kicker="Descuentos" title="Prendas con descuento" products={sale} onAdd={add} />}

        {/* Newsletter */}
         {homeSections.newsletter && <section className="bg-primary text-primary-foreground">
          <div className="mx-auto grid max-w-[1600px] gap-8 px-4 py-16 md:grid-cols-2 md:items-end md:px-8">
            <h2 className="text-4xl font-normal md:text-5xl">Sigamos cerca.</h2>
            <div><p className="max-w-md text-sm leading-7 text-primary-foreground/80">Encontrá novedades e inspiración en nuestro Instagram.</p>{instagramUrl && <Button asChild variant="outline" className="mt-6 h-12 rounded-none border-primary-foreground/40 bg-transparent text-primary-foreground"><a href={instagramUrl} target="_blank" rel="noreferrer">Seguir a Etérea <ArrowUpRight /></a></Button>}</div>
          </div>
        </section>}

        {/* Instagram y contacto */}
        {instagramSection}
        <ContactSection />
      </main>

      <StoreFooter />
    </div>
  );
}
