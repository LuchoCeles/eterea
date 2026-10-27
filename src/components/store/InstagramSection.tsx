"use client";

import { useEffect, useRef, useState } from "react";
import { Grid3X3, Heart, Instagram, Play } from "lucide-react";
import Image from "next/image";
import { useContent } from "@/components/providers/ContentProvider";
import { responsiveCloudinaryImage } from "@/lib/cloudinary-media";
import { resolveImageSource } from "@/lib/image-source";
import type { InstagramPost } from "@/lib/content";
import type { InstagramMediaAsset } from "@/lib/instagram-media";
import { visibleInstagramPosts } from "@/lib/storefront-rules";

const profileUrl = "https://www.instagram.com/eterea.newconcept/";
const brandImage = "/assets/eterea-placeholder.svg";
type InstagramCover = Pick<InstagramMediaAsset, "imageUrl" | "posterUrl">;

function InstagramThumbnail({ image, fromMeta, alt }: { image: string; fromMeta: boolean; alt: string }) {
  const [failed, setFailed] = useState(false);
  const optimized = fromMeta ? null : responsiveCloudinaryImage(image);
  const className = "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none";
  if (failed) return <span className="flex h-full w-full items-center justify-center bg-pearl text-accent" aria-label="Imagen no disponible"><Instagram className="h-6 w-6" aria-hidden="true" /></span>;
  return fromMeta ? (
    <Image src={image} alt={alt} loading="lazy" sizes="108px" width={108} height={108} className={className} onError={() => setFailed(true)} />
  ) : (
    <img src={optimized?.src ?? image} srcSet={optimized?.srcSet} sizes={optimized?.srcSet ? "108px" : undefined} alt={alt} loading="lazy" width={108} height={108} className={className} onError={() => setFailed(true)} />
  );
}

export function InstagramSection({ posts, mediaAssets }: { posts: InstagramPost[]; mediaAssets: Record<string, InstagramCover> }) {
  const products = useContent("products");
  const { homeSections } = useContent("texts");
  const sectionRef = useRef<HTMLElement>(null);
  const [observing, setObserving] = useState(false);
  const [visible, setVisible] = useState(false);
  const thumbnails = visibleInstagramPosts(posts).flatMap((post) => {
    const asset = mediaAssets[post.url];
    const image = asset?.imageUrl || asset?.posterUrl || (post.image || post.productId ? resolveImageSource(post, products) : "");
    return image ? [{ post, image, fromMeta: Boolean(asset?.imageUrl || asset?.posterUrl) }] : [];
  }).slice(0, 6);

  useEffect(() => {
    if (!sectionRef.current || !window.IntersectionObserver || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (sectionRef.current.getBoundingClientRect().top < window.innerHeight) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      setVisible(true);
      observer.disconnect();
    }, { threshold: 0.12 });
    observer.observe(sectionRef.current);
    const frame = window.requestAnimationFrame(() => setObserving(true));
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  if (!homeSections.instagram) return null;

  return (
    <section id="instagram" ref={sectionRef} aria-labelledby="instagram-title" className="border-t bg-background px-4 py-16 text-foreground sm:px-6 md:py-24">
      <div className="mx-auto max-w-[1200px] rounded-[2rem] bg-sea px-5 py-12 text-center sm:px-8 md:py-16">
        <p className="eyebrow mb-8 text-sea-foreground/70">Nuestro universo en Instagram</p>
        <div className={"mx-auto w-full max-w-[330px] transition-[opacity,transform] duration-700 ease-out motion-reduce:transform-none motion-reduce:transition-none " + (observing && !visible ? "translate-y-6 opacity-0" : "translate-y-0 opacity-100")}>
          <div className="overflow-hidden rounded-[2.5rem] border-[3px] border-foreground/15 bg-background p-2.5 shadow-[0_20px_50px_-35px_rgba(52,45,36,0.65)]">
            <div className="min-h-[475px] overflow-hidden rounded-[1.95rem] bg-photo-paper px-3 pb-5 pt-3 text-left sm:min-h-[500px]">
              <div className="mx-auto mb-5 h-1.5 w-16 rounded-full bg-foreground/15" aria-hidden="true" />
              <div className="mb-4 flex items-center gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-border bg-sand">
                  <img src={brandImage} alt="Identidad visual de Etérea" className="h-full w-full object-cover" width={56} height={56} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">@eterea.newconcept</p>
                  <p className="text-[11px] tracking-wide text-muted-foreground">ETÉREA NEW CONCEPT</p>
                </div>
              </div>
              <div className="mb-3 flex items-center gap-2 border-b border-border pb-2 text-foreground/70" aria-hidden="true">
                <Grid3X3 className="h-4 w-4" strokeWidth={1.5} />
                <span className="text-[10px] uppercase tracking-[0.15em]">Publicaciones</span>
              </div>
              {thumbnails.length ? (
                <div className="grid min-h-[208px] grid-cols-3 content-start gap-1.5" aria-label="Publicaciones de Instagram de Etérea">
                  {thumbnails.map(({ post, image, fromMeta }) => (
                    <a key={post.id} href={post.url} target="_blank" rel="noopener noreferrer" aria-label={"Abrir " + (post.kind === "reel" ? "reel" : "publicación") + " de Etérea" + (post.title ? ": " + post.title : "") + " en Instagram"} className="group relative aspect-square overflow-hidden rounded-xl bg-pearl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                      <InstagramThumbnail image={image} fromMeta={fromMeta} alt={post.title || "Publicación de Etérea"} />
                      {post.kind === "reel" && <Play className="absolute bottom-1.5 right-1.5 h-4 w-4 fill-white text-white drop-shadow" aria-hidden="true" />}
                    </a>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[208px] flex-col items-center justify-center rounded-xl bg-pearl px-6 text-center">
                  <Instagram className="h-7 w-7 text-accent" strokeWidth={1.4} aria-hidden="true" />
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">Las publicaciones de Etérea van a aparecer acá.</p>
                </div>
              )}
              <div className="mt-6 flex items-center justify-around border-t border-border pt-4 text-foreground/55" aria-hidden="true">
                <Grid3X3 className="h-5 w-5" strokeWidth={1.5} />
                <Heart className="h-5 w-5" strokeWidth={1.5} />
                <Instagram className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div className="mx-auto mt-6 h-1 w-20 rounded-full bg-foreground/20" aria-hidden="true" />
            </div>
          </div>
        </div>
        <h2 id="instagram-title" className="mt-9 font-display text-3xl leading-tight text-sea-foreground sm:text-4xl">Un poquito más de Etérea</h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-sea-foreground/80 sm:text-base">Descubrí nuestras novedades y acompañanos en este nuevo concepto.</p>
        <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground transition-[background-color,transform] duration-300 hover:-translate-y-0.5 hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring motion-reduce:transform-none motion-reduce:transition-none">
          Seguinos en Instagram <Instagram className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
