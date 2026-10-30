"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ChevronRight, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/providers/CartProvider";
import { useContent } from "@/components/providers/ContentProvider";
import { CatalogProductCard } from "@/components/store/CatalogProductCard";
import { ProductDetailPrice } from "@/components/store/ProductDetailPrice";
import { ProductImage } from "@/components/store/ProductImage";
import { ProductImageLightbox } from "@/components/store/ProductImageLightbox";
import { automaticProductTag } from "@/lib/storefront-rules";
import type { StoreProduct } from "@/lib/content";

export function ProductDetail({ source, relatedIds }: { source: StoreProduct; relatedIds: string[] }) {
  const { add } = useCart();
  const products = useContent("products");
  const offersEnabled = useContent("texts").offers.enabled;
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxImage, setLightboxImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [selectionError, setSelectionError] = useState("");
  const [added, setAdded] = useState(false);
  const relatedById = useMemo(() => new Map(products.map((item) => [item.id, item])), [products]);
  const product = source;
  const related = relatedIds.flatMap((id) => {
    const item = relatedById.get(id);
    return item ? [item] : [];
  });
  const images = product.images?.length ? product.images : [product.image ?? ""];
  const sizes = product.sizes ?? [];
  const colors = product.colors ?? [];
  const soldOutColors = new Set(product.soldOutColors ?? []);
  const unavailable = !!product.soldOut || (colors.length > 0 && colors.every((option) => soldOutColors.has(option)));
  const tag = automaticProductTag(product, offersEnabled);

  function openLightbox(index: number) {
    setLightboxImage(index);
    setLightboxOpen(true);
  }

  function addSelectedProduct() {
    if (unavailable) {
      setSelectionError("Esta prenda está agotada.");
      return;
    }
    if (sizes.length && !size) {
      setSelectionError("Elegí un talle para agregar la prenda.");
      return;
    }
    if (colors.length && !color) {
      setSelectionError("Elegí un color para agregar la prenda.");
      return;
    }
    if (color && soldOutColors.has(color)) {
      setSelectionError("Este color está agotado. Elegí otro para continuar.");
      return;
    }
    add(product, { size: size || undefined, color: color || undefined });
    setSelectionError("");
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div>
      <main>
        <nav aria-label="Ruta de navegación" className="mx-auto flex max-w-[1600px] items-center gap-2 px-4 py-5 text-xs text-muted-foreground md:px-8">
          <Link href="/" className="hover:text-foreground">Inicio</Link><ChevronRight className="h-3 w-3" />
          <Link href="/productos" className="hover:text-foreground">Prendas</Link><ChevronRight className="h-3 w-3" />
          <span className="truncate text-foreground">{product.name}</span>
        </nav>

        <div className="mx-auto grid max-w-[1600px] gap-8 px-4 pb-20 md:px-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)] lg:gap-16">
          <section aria-label={`Fotos de ${product.name}`} className="min-w-0">
            <div className="mx-auto flex w-full max-w-[760px] flex-col gap-3">
              <div className="relative aspect-square w-full overflow-hidden bg-background">
                <button type="button" onClick={() => openLightbox(activeImage)} aria-label={`Ampliar foto ${activeImage + 1} de ${product.name}`} className="h-full w-full cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary">
                  <ProductImage src={images[activeImage]} presentation={product.imageSettings?.[activeImage]} alt={`${product.name}, foto ${activeImage + 1}`} loading="eager" sizes="(min-width: 1024px) 55vw, 100vw" className="h-full w-full object-contain" />
                </button>
                {(unavailable || tag) && (
                  <span className={`eyebrow pointer-events-none absolute left-3 top-3 px-3 py-1.5 sm:left-4 sm:top-4 ${unavailable ? "bg-muted text-muted-foreground" : tag === "Oferta" ? "bg-accent text-accent-foreground" : "bg-background text-foreground"}`}>
                    {unavailable ? "Agotada" : tag}
                  </span>
                )}
              </div>
              {images.length > 1 && <div className="grid h-[clamp(48px,10dvh,88px)] shrink-0 grid-cols-5 gap-2 sm:gap-3">
                {images.map((src, index) => <button key={`${src}-${index}`} type="button" onClick={() => setActiveImage(index)} aria-label={`Mostrar foto ${index + 1} de ${product.name}`} aria-pressed={activeImage === index} className={`h-full min-w-0 overflow-hidden border-2 bg-background transition-colors ${activeImage === index ? "border-primary" : "border-transparent hover:border-border"}`}>
                  <ProductImage src={src} presentation={product.imageSettings?.[index]} alt="" loading="lazy" sizes="100px" className="h-full w-full object-contain" />
                </button>)}
              </div>}
            </div>
          </section>

          <section className="min-w-0 lg:sticky lg:top-36 lg:self-start">
            <p className="eyebrow text-muted-foreground">Etérea · {product.category}</p>
            <h1 className="mt-4 font-display text-4xl font-normal leading-[1.05] sm:text-5xl xl:text-6xl">{product.name}</h1>
            <ProductDetailPrice product={product} />
            {product.description?.trim() && <p className="whitespace-pre-line border-b py-7 text-sm leading-7 text-muted-foreground">{product.description}</p>}

            {sizes.length > 0 && <div className="pt-7">
              <div className="flex items-baseline justify-between"><h2 className="text-sm font-medium">Talle</h2><span className="text-xs text-muted-foreground">Elegí el tuyo</span></div>
              <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Elegir talle">
                {sizes.map((option) => <button key={option} type="button" onClick={() => { setSize(option); setSelectionError(""); }} aria-pressed={size === option} className={`min-w-14 border px-4 py-3 text-sm transition-colors ${size === option ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary"}`}>{option}</button>)}
              </div>
            </div>}

            {colors.length > 0 && <div className="pt-7">
              <h2 className="text-sm font-medium">Color</h2>
              <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Elegir color">
                {colors.map((option) => {
                  const optionSoldOut = !!product.soldOut || soldOutColors.has(option);
                  return <button key={option} type="button" disabled={optionSoldOut} onClick={() => { setColor(option); setSelectionError(""); }} aria-pressed={color === option && !optionSoldOut} aria-label={optionSoldOut ? `${option}, agotado` : option} className={`border px-4 py-3 text-sm transition-colors ${optionSoldOut ? "cursor-not-allowed border-border bg-muted text-muted-foreground line-through opacity-70" : color === option ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary"}`}>{option}</button>;
                })}
              </div>
            </div>}

            <p role="alert" className="min-h-6 pt-3 text-sm text-accent">{selectionError}</p>
            <button type="button" disabled={unavailable} onClick={addSelectedProduct} className={`mt-2 flex h-14 w-full items-center justify-center gap-3 px-5 text-sm font-medium transition-colors ${unavailable ? "cursor-not-allowed bg-muted text-muted-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>
              {added ? <Check className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}{unavailable ? "Agotada" : added ? "Agregada al carrito" : "Agregar al carrito"}
            </button>
            <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">Podés revisar las prendas elegidas en el carrito y hacer tu pedido por WhatsApp.</p>
            <Link href="/productos" className="mt-8 inline-flex items-center gap-2 border-b border-foreground pb-1 text-sm hover:text-accent"><ArrowLeft className="h-4 w-4" /> Seguir descubriendo</Link>
          </section>
        </div>

        {related.length > 0 && <section className="border-t bg-sand/25 py-16 md:py-20">
          <div className="mx-auto max-w-[1600px] px-4 md:px-8">
            <span className="eyebrow text-muted-foreground">Para seguir explorando</span>
            <div className="mt-3 flex items-end justify-between gap-4"><h2 className="font-display text-3xl md:text-5xl">Otras prendas que te pueden gustar</h2><Link href="/productos" className="hidden shrink-0 items-center gap-1 border-b pb-1 text-sm sm:inline-flex">Ver todas <ArrowRight className="h-4 w-4" /></Link></div>
            <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-5">{related.map((item) => <CatalogProductCard key={item.id} product={item} onAdd={add} />)}</div>
          </div>
        </section>}
      </main>

      {lightboxOpen && <ProductImageLightbox images={images} imageSettings={product.imageSettings} productName={product.name} initialImage={lightboxImage} onOpenChange={setLightboxOpen} />}

      <footer className="border-t px-4 py-8 text-center text-xs text-muted-foreground md:px-8">© 2026 Etérea New Concept · <Link href="/productos" className="underline underline-offset-4">Volver a la tienda</Link></footer>
    </div>
  );
}
