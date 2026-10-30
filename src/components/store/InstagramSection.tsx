"use client";

import { useEffect, useRef, useState } from "react";
import { CirclePlus, Clapperboard, Grid3X3, Heart, House, Instagram, Menu, Play, Search, UserRound, Wifi } from "lucide-react";
import { useContent } from "@/components/providers/ContentProvider";
import { WhatsAppIcon } from "@/components/store/WhatsAppIcon";
import { responsiveCloudinaryImage } from "@/lib/cloudinary-media";
import { resolveImageSource } from "@/lib/image-source";
import type { InstagramPost } from "@/lib/content";
import type { InstagramMediaAsset } from "@/lib/instagram-media";
import { instagramProfileUrl, normalizeWhatsAppNumber, visibleInstagramPosts } from "@/lib/storefront-rules";

const brandImage = "/assets/eterea-placeholder.svg";
type InstagramCover = Pick<InstagramMediaAsset, "imageUrl" | "posterUrl">;
type InstagramThumbnailData = { post: InstagramPost; image: string; fromMeta: boolean };

function InstagramThumbnail({ image, fromMeta, alt }: { image: string; fromMeta: boolean; alt: string }) {
  const [failed, setFailed] = useState(false);
  const optimized = fromMeta ? null : responsiveCloudinaryImage(image);
  const className = "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none";
  if (failed) return <span className="flex h-full w-full items-center justify-center bg-pearl text-accent" aria-label="Imagen no disponible"><Instagram className="h-6 w-6" aria-hidden="true" /></span>;
  return <img src={optimized?.src ?? image} srcSet={optimized?.srcSet} sizes={optimized?.srcSet ? "128px" : undefined} alt={alt} loading="lazy" width={128} height={128} className={className} onError={() => setFailed(true)} />;
}

function InstagramPhone({ username, thumbnails }: { username: string; thumbnails: InstagramThumbnailData[] }) {
  const isEtereaAccount = username.toLowerCase() === "eterea.newconcept";

  return (
    <div className="mx-auto w-full max-w-[290px] lg:max-w-[380px] [container-type:inline-size]">
      <div className="relative w-full aspect-[1/2] rounded-[clamp(30px,13cqw,39px)] border border-[#494741] bg-[linear-gradient(135deg,#dedbd3_0%,#5d5a54_8%,#c6c2b9_15%,#302f2c_25%,#77736b_46%,#d9d6ce_69%,#45433f_100%)] p-[1.8cqw] shadow-[0_28px_58px_-36px_rgba(45,38,31,0.72)]">
        <span className="pointer-events-none absolute left-[0.3cqw] top-[17%] h-[8cqw] w-[1cqw] rounded-l-full bg-[#55534d]" aria-hidden="true" />
        <span className="pointer-events-none absolute left-[0.3cqw] top-[28%] h-[12cqw] w-[1cqw] rounded-l-full bg-[#55534d]" aria-hidden="true" />
        <span className="pointer-events-none absolute right-[0.3cqw] top-[24%] h-[11cqw] w-[1cqw] rounded-r-full bg-[#55534d]" aria-hidden="true" />
        <div className="relative h-full w-full rounded-[clamp(27px,11.5cqw,34px)] border-[1.4cqw] border-[#191817] bg-[#111] p-[0.7cqw]">
          <div className="flex h-full flex-col overflow-hidden rounded-[clamp(22px,9.5cqw,29px)] bg-white text-[#171717]">
            <div className="relative flex h-[14cqw] shrink-0 items-center justify-between px-[5cqw] text-[3.8cqw] font-semibold tracking-tight" aria-hidden="true">
              <span>9:41</span>
              <span className="absolute left-1/2 top-1/2 h-[6cqw] w-[24cqw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#050505]" />
              <span className="flex items-center gap-[1.4cqw]">
                <span className="inline-flex h-[4.2cqw] items-end gap-[0.7cqw]"><i className="h-[1.4cqw] w-[0.7cqw] rounded-full bg-current" /><i className="h-[2.2cqw] w-[0.7cqw] rounded-full bg-current" /><i className="h-[3.1cqw] w-[0.7cqw] rounded-full bg-current" /><i className="h-[4.2cqw] w-[0.7cqw] rounded-full bg-current" /></span>
                <Wifi className="h-[4.2cqw] w-[4.2cqw]" strokeWidth={2.2} />
                <span className="relative flex h-[3.2cqw] w-[6.2cqw] items-center rounded-[0.7cqw] border-[0.6cqw] border-current p-[0.3cqw]"><span className="h-full w-[72%] rounded-[0.4cqw] bg-current" /><i className="absolute -right-[1.2cqw] h-[1.4cqw] w-[0.6cqw] rounded-r-sm bg-current" /></span>
              </span>
            </div>

            <div className="flex h-[13cqw] shrink-0 items-center justify-between px-[4.5cqw]">
              <p className="min-w-0 truncate text-[5.1cqw] font-semibold tracking-tight">Instagram</p>
              <div className="flex shrink-0 items-center gap-[4cqw]" aria-hidden="true">
                <CirclePlus className="h-[6.6cqw] w-[6.6cqw]" strokeWidth={1.8} />
                <Heart className="h-[6.4cqw] w-[6.4cqw]" strokeWidth={1.8} />
                <Menu className="h-[6.6cqw] w-[6.6cqw]" strokeWidth={1.8} />
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-[4cqw] px-[4.5cqw] py-[1.3cqw]">
              <div className="flex h-[17.5cqw] w-[17.5cqw] shrink-0 items-center justify-center overflow-hidden rounded-full border border-black/10 bg-[#e9e4dc]">
                {isEtereaAccount ? (
                  <img src={brandImage} alt="" className="h-full w-full object-cover" width={58} height={58} />
                ) : (
                  <UserRound className="h-[9cqw] w-[9cqw] text-[#9c9489]" strokeWidth={1.5} aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0">
                {username && <p className="truncate text-[4.4cqw] font-semibold">@{username}</p>}
                {isEtereaAccount && <p className="mt-[1cqw] truncate text-[3.4cqw] text-black/60">ETÉREA NEW CONCEPT</p>}
              </div>
            </div>

            <div className="grid h-[12cqw] shrink-0 grid-cols-3 border-y border-black/10 text-black/45" aria-hidden="true">
              <div className="relative flex items-center justify-center text-black"><Grid3X3 className="h-[6cqw] w-[6cqw]" strokeWidth={1.8} /><span className="absolute inset-x-[18%] bottom-0 h-[0.7cqw] bg-black" /></div>
              <div className="flex items-center justify-center"><Clapperboard className="h-[6cqw] w-[6cqw]" strokeWidth={1.7} /></div>
              <div className="flex items-center justify-center"><UserRound className="h-[6cqw] w-[6cqw]" strokeWidth={1.7} /></div>
            </div>

            {thumbnails.length ? (
              <div className="grid max-h-[106cqw] shrink-0 grid-cols-3 gap-[0.7cqw] overflow-hidden bg-white" aria-label="Publicaciones de Instagram de Etérea">
                {thumbnails.map(({ post, image, fromMeta }) => (
                  <a key={post.id} href={post.url} target="_blank" rel="noopener noreferrer" aria-label={"Abrir " + (post.kind === "reel" ? "reel" : "publicación") + " de Etérea" + (post.title ? ": " + post.title : "") + " en Instagram"} className="group relative block aspect-[3/4] overflow-hidden bg-[#f0efed] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring">
                    <InstagramThumbnail image={image} fromMeta={fromMeta} alt={post.title || "Publicación de Etérea"} />
                    {post.kind === "reel" && <Play className="absolute right-[2cqw] top-[2cqw] h-[5cqw] w-[5cqw] fill-white text-white drop-shadow" aria-hidden="true" />}
                  </a>
                ))}
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-[6cqw] text-center">
                <Instagram className="h-[9cqw] w-[9cqw] text-accent" strokeWidth={1.4} aria-hidden="true" />
                <p className="mt-[3cqw] text-[3.8cqw] leading-relaxed text-black/55">Las publicaciones de Etérea van a aparecer acá.</p>
              </div>
            )}

            <div className="mt-auto flex h-[15cqw] shrink-0 items-center justify-around border-t border-black/10 bg-white px-[2cqw] text-black" aria-hidden="true">
              <House className="h-[6.5cqw] w-[6.5cqw]" strokeWidth={1.8} />
              <Search className="h-[6.5cqw] w-[6.5cqw]" strokeWidth={1.8} />
              <CirclePlus className="h-[6.5cqw] w-[6.5cqw]" strokeWidth={1.8} />
              <Clapperboard className="h-[6.5cqw] w-[6.5cqw]" strokeWidth={1.8} />
              <span className="flex h-[7.5cqw] w-[7.5cqw] items-center justify-center overflow-hidden rounded-full border border-black/25 bg-sand p-[0.8cqw]"><UserRound className="h-full w-full text-black/60" strokeWidth={1.5} /></span>
            </div>
            <div className="flex h-[7.5cqw] shrink-0 items-center justify-center bg-white" aria-hidden="true"><span className="h-[1.2cqw] w-[25cqw] rounded-full bg-black/80" /></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function InstagramSection({ posts, mediaAssets }: { posts: InstagramPost[]; mediaAssets: Record<string, InstagramCover> }) {
  const products = useContent("products");
  const contact = useContent("contact");
  const instagramUsername = contact.instagramUsername.trim().replace(/^@/, "");
  const profileUrl = instagramProfileUrl(instagramUsername);
  const whatsappNumber = normalizeWhatsAppNumber(contact.whatsapp);
  const whatsappUrl = whatsappNumber
    ? "https://wa.me/" + whatsappNumber + "?text=" + encodeURIComponent("¡Hola! Estuve viendo la web de Etérea y me gustaría hacer una consulta.")
    : null;
  const { homeSections } = useContent("texts");
  const sectionRef = useRef<HTMLElement>(null);
  const [observing, setObserving] = useState(false);
  const [visible, setVisible] = useState(false);
  const thumbnails: InstagramThumbnailData[] = visibleInstagramPosts(posts).flatMap((post) => {
    const asset = mediaAssets[post.url];
    const image = asset?.imageUrl || asset?.posterUrl || (post.image || post.productId ? resolveImageSource(post, products) : "");
    return image ? [{ post, image, fromMeta: Boolean(asset?.imageUrl || asset?.posterUrl) }] : [];
  }).slice(0, 9);

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
    <section id="instagram" ref={sectionRef} aria-labelledby="instagram-title" className="border-t bg-background px-4 py-10 text-foreground sm:px-6 md:py-12">
      <div className="mx-auto grid max-w-[1200px] gap-8 rounded-[2rem] bg-sea px-4 py-9 text-center sm:px-8 sm:py-10 md:py-12 lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-12 lg:text-left xl:gap-16 xl:px-16">
        <div className="flex flex-col items-center lg:items-start">
          <p className="eyebrow mb-2 text-sea-foreground/70">Nuestro universo en Instagram</p>
          <h2 id="instagram-title" className="font-display text-3xl leading-tight text-sea-foreground sm:text-4xl">Sigamos cerca.</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-sea-foreground/80 sm:text-base lg:mx-0">Descubrí nuestras novedades, inspirate con Etérea y escribinos cuando quieras.</p>
          <div className="mt-5 flex w-full flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
            {profileUrl && <a href={profileUrl} target="_blank" rel="noopener noreferrer" aria-label={"Seguinos en Instagram @" + instagramUsername} className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-[background-color,transform] duration-300 hover:-translate-y-0.5 hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring motion-reduce:transform-none motion-reduce:transition-none sm:w-auto">
              <Instagram className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" /> Seguinos en Instagram
            </a>}
            {whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="Escribinos por WhatsApp" className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-primary bg-transparent px-6 py-3 text-sm font-medium text-primary transition-[background-color,transform,color] duration-300 hover:-translate-y-0.5 hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring motion-reduce:transform-none motion-reduce:transition-none sm:w-auto">
              <WhatsAppIcon /> Escribinos por WhatsApp
            </a>}
          </div>
        </div>
        <div className={"mx-auto mt-5 w-full max-w-[380px] transition-[opacity,transform] duration-700 ease-out motion-reduce:transform-none motion-reduce:transition-none lg:mt-0 " + (observing && !visible ? "translate-y-6 opacity-0" : "translate-y-0 opacity-100")}>
          <InstagramPhone username={instagramUsername} thumbnails={thumbnails} />
        </div>
      </div>
    </section>
  );
}
