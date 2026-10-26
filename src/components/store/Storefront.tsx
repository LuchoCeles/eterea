"use client";

import { ArrowUpRight, Waves, Leaf, Shell } from "lucide-react";
import { HeroCarousel } from "@/components/store/HeroCarousel";
import { ProductCarousel } from "@/components/store/ProductCarousel";
import { useContent } from "@/components/providers/ContentProvider";
import { useCart } from "@/components/providers/CartProvider";
import { InstagramSection } from "@/components/store/InstagramSection";
import type { InstagramMediaAsset } from "@/lib/instagram-media";
import { Button } from "@/components/ui/button";
import { instagramProfileUrl, productWithoutOffers, visibleAnnouncements, visibleSaleProducts } from "@/lib/storefront-rules";
import { resolveImageSource } from "@/lib/image-source";
import { visibleStoreProducts } from "@/lib/content";

const logo = "/assets/eterea-placeholder.svg";
export function Storefront({ unavailableInstagramUrls, instagramMediaAssets }: { unavailableInstagramUrls: string[]; instagramMediaAssets: Record<string, InstagramMediaAsset> }) {
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
  const icons = [Waves, Shell, Leaf];
  const benefits = T.benefits.filter((benefit) => visibleAnnouncements([`${benefit.t} ${benefit.d}`], T.offers.enabled).length);
  const marquee = visibleAnnouncements(T.marquee, T.offers.enabled);

  return (
    <div className="min-h-screen">
      <main>
        <HeroCarousel />

        {/* Franja publicitaria */}
        {homeSections.benefits && <div className="border-b">
          <div className="mx-auto grid max-w-[1600px] grid-cols-1 divide-y px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 md:px-8">
            {benefits.map(({ t, d }, bi) => { const Icon = icons[bi % 3] ?? Waves; return (
              <div key={bi} className="flex items-center gap-4 py-5 sm:justify-center">
                <Icon className="h-5 w-5 text-accent" strokeWidth={1.5} />
                <div>
                  <p className="text-sm font-medium">{t}</p>
                  <p className="text-xs text-muted-foreground">{d}</p>
                </div>
              </div>
            ); })}
          </div>
        </div>}

        {/* Categorías */}
        {homeSections.categories && homeCategoryCards.length > 0 && <section id="prendas" className="mx-auto max-w-[1600px] px-4 pt-16 md:px-8">
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
                <img src={resolveImageSource(card, products)} alt="" loading="lazy" className="aspect-[3/4] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
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
            <img src={resolveImageSource(T.split, products)} alt={T.split.sub} loading="lazy" className="absolute inset-0 h-full w-full object-cover object-left" />
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

        {/* Marquee */}
        {homeSections.marquee && marquee.length > 0 && <div className="overflow-hidden border-y bg-sea py-6 text-sea-foreground">
          <div className="animate-marquee flex w-max gap-12 whitespace-nowrap">
            {Array.from({ length: 2 }).map((_, k) => (
              <div key={k} className="flex gap-12">
                {marquee.map((t, j) => (
                  <span key={j} className="flex items-center gap-12 font-display text-3xl font-normal md:text-4xl">
                    {t} <Waves className="h-6 w-6" strokeWidth={1} />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>}

        {homeSections.sale && sale.length > 0 && <ProductCarousel id="descuentos" kicker="Descuentos" title="Prendas con descuento" products={sale} onAdd={add} />}

        {/* Editorial */}
        {homeSections.editorial && <section id="new-concept" className="mx-auto grid max-w-[1600px] items-center gap-10 px-4 py-20 md:grid-cols-12 md:px-8">
          <div className="md:col-span-5">
            <img src={resolveImageSource(T.editorial, products)} alt="Editorial Etérea" loading="lazy" className="aspect-[4/5] w-full object-cover" />
          </div>
          <div className="md:col-span-6 md:col-start-7">
            <span className="eyebrow text-muted-foreground">{T.editorial.kicker}</span>
            <h2 className="mt-4 text-4xl font-normal leading-[1.1] md:text-6xl">
              {T.editorial.title}
            </h2>
            <p className="mt-6 max-w-lg text-sm leading-7 text-muted-foreground">
              {T.editorial.text}
            </p>
            {(homeSections.instagram || instagramUrl) && <a href={homeSections.instagram ? "#instagram" : instagramUrl ?? "#instagram"} target={homeSections.instagram ? undefined : "_blank"} rel={homeSections.instagram ? undefined : "noreferrer"} className="mt-8 inline-flex items-center gap-2 border-b border-foreground pb-1 text-sm">
              {T.editorial.cta} <ArrowUpRight className="h-4 w-4" />
            </a>}
            <img src={"/assets/eterea-placeholder.svg"} alt="La flor, la espiral y la concha nacaradas de Etérea" loading="lazy" className="mt-8 h-40 w-40 object-contain" />
          </div>
        </section>}

        {/* Instagram */}
        <InstagramSection unavailableUrls={unavailableInstagramUrls} mediaAssets={instagramMediaAssets} />

        {/* Newsletter */}
         {homeSections.newsletter && <section className="bg-primary text-primary-foreground">
          <div className="mx-auto grid max-w-[1600px] gap-8 px-4 py-16 md:grid-cols-2 md:items-end md:px-8">
            <h2 className="text-4xl font-normal md:text-5xl">Sigamos cerca.</h2>
            <div><p className="max-w-md text-sm leading-7 text-primary-foreground/80">Encontrá novedades e inspiración en nuestro Instagram.</p>{instagramUrl && <Button asChild variant="outline" className="mt-6 h-12 rounded-none border-primary-foreground/40 bg-transparent text-primary-foreground"><a href={instagramUrl} target="_blank" rel="noreferrer">Seguir a Etérea <ArrowUpRight /></a></Button>}</div>
          </div>
        </section>}
      </main>

      <footer className="bg-background">
        <div className="mx-auto grid max-w-[1600px] gap-10 px-4 py-14 md:grid-cols-4 md:px-8">
          <img src={logo} alt="Etérea New Concept" className="h-24 w-48 object-contain" />
          {[
            { t: "Tienda", l: [
              ...(visibleHomeSections.newArrivals ? [{ name: "Lo nuevo", href: "/#nuevo" }] : []),
              { name: "Prendas", href: "/productos" },
              ...(homeSections.sale && sale.length ? [{ name: "Descuentos", href: "/#descuentos" }] : []),
            ] },
            { t: "Etérea", l: [
              ...(homeSections.editorial ? [{ name: "New Concept", href: "/#new-concept" }] : []),
              ...(homeSections.instagram ? [{ name: "Instagram", href: "/#instagram" }] : []),
            ] },
            { t: "Contacto", l: instagramUrl ? [{ name: "Escribinos por Instagram", href: instagramUrl }] : [] },
          ].map((c) => (
            <div key={c.t}>
              <p className="eyebrow text-muted-foreground">{c.t}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {c.l.map((x) => <li key={x.name}><a href={x.href} className="hover:text-accent">{x.name}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-5 text-xs text-muted-foreground md:px-8"><p>© 2026 Etérea New Concept</p><a href="/admin" className="hover:text-foreground">Administración</a></div>
      </footer>
    </div>
  );
}
