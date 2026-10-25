"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { ArrowUpRight, Instagram, Play } from "lucide-react";
import { useContent } from "@/components/providers/ContentProvider";
import { visibleInstagramPosts } from "@/lib/storefront-rules";
import type { InstagramPost } from "@/lib/content";
import { Button } from "@/components/ui/button";
const flower = "/assets/eterea-placeholder.svg";

function processEmbeds() {
  const instagram = (window as Window & { instgrm?: { Embeds?: { process: () => void } } }).instgrm;
  instagram?.Embeds?.process();
}

function InstagramCard({ post }: { post: InstagramPost }) {
  const [showEmbed, setShowEmbed] = useState(!post.image);

  useEffect(() => {
    if (showEmbed) processEmbeds();
  }, [showEmbed]);

  return (
    <article className="min-w-0">
      {showEmbed ? (
        <div className="min-h-[400px] overflow-hidden bg-white text-foreground">
          <blockquote className="instagram-media mx-auto w-full max-w-[540px]" data-instgrm-permalink={post.url} data-instgrm-version="14">
            <a href={post.url} target="_blank" rel="noreferrer" className="block p-6 text-sm underline">
              Ver {post.kind === "reel" ? "reel" : "publicación"} en Instagram
            </a>
          </blockquote>
        </div>
      ) : (
        <button type="button" onClick={() => setShowEmbed(true)} aria-label={`Mostrar ${post.kind === "reel" ? "reel" : "publicación"} de Instagram en esta página`} className="group relative block aspect-[4/5] w-full overflow-hidden bg-pearl text-foreground">
          <img src={post.image} alt={post.title || "Publicación de Etérea"} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <span className="absolute bottom-4 left-4 flex items-center gap-2 bg-primary px-4 py-3 text-sm text-primary-foreground"><Play className="h-4 w-4" /> Ver acá</span>
        </button>
      )}
      <a href={post.url} target="_blank" rel="noreferrer" className="mt-3 flex items-center justify-between gap-3 border-b border-sea-foreground/20 py-3 text-sm">
        {post.title || (post.kind === "reel" ? "Reel de Etérea" : "Publicación de Etérea")}
        <ArrowUpRight className="h-4 w-4 shrink-0" />
      </a>
    </article>
  );
}

export function InstagramSection() {
  const posts = useContent("instagram");
  const { homeSections } = useContent("texts");
  const validPosts = visibleInstagramPosts(posts);
  const postUrls = validPosts.map((post) => post.url).join("|");

  useEffect(() => {
    processEmbeds();
  }, [postUrls]);
  if (!homeSections.instagram) return null;
  return (
    <section id="instagram" className="border-t bg-sea py-14 text-sea-foreground md:py-20">
      <div className="mx-auto max-w-[1600px] px-4 md:px-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="flex items-center gap-5">
            <img src={flower} alt="" className="hidden h-20 w-20 object-contain sm:block" />
            <div className="min-w-0">
              <span className="eyebrow">Nuestro día a día</span>
              <h2 className="mt-3 text-3xl font-normal md:text-5xl">El universo Etérea</h2>
              <p className="mt-3 text-sm">@eterea.newconcept</p>
            </div>
          </div>
          <Button asChild variant="outline" className="h-12 w-fit rounded-none border-sea-foreground/30 bg-transparent text-sea-foreground"><a href="https://www.instagram.com/eterea.newconcept/" target="_blank" rel="noreferrer"><Instagram /> Ver publicaciones y reels <ArrowUpRight /></a></Button>
        </div>
        {validPosts.length > 0 && <>
          <Script src="https://www.instagram.com/embed.js" strategy="afterInteractive" onReady={processEmbeds} />
          <div className="mt-10 grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {validPosts.map((post) => <InstagramCard key={post.id} post={post} />)}
          </div>
        </>}
      </div>
    </section>
  );
}
