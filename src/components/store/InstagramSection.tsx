"use client";

import { useState } from "react";
import { ArrowUpRight, Instagram, Play } from "lucide-react";
import { useContent } from "@/components/providers/ContentProvider";
import { resolveImageSource } from "@/lib/image-source";
import type { StoreProduct } from "@/lib/content";
import { instagramEmbedUrl, visibleInstagramPosts } from "@/lib/storefront-rules";
import type { InstagramPost } from "@/lib/content";
import { Button } from "@/components/ui/button";
const flower = "/assets/eterea-placeholder.svg";

function InstagramCard({ post, products }: { post: InstagramPost; products: StoreProduct[] }) {
  const image = post.image || post.productId ? resolveImageSource(post, products) : "";
  const [openedImage, setOpenedImage] = useState<string | null>(null);
  const showEmbed = !image || openedImage === image;
  const embedUrl = instagramEmbedUrl(post.url);
  if (!embedUrl) return null;

  return (
    <article className="min-w-0">
      {showEmbed ? (
        <div className="overflow-hidden bg-white">
          <iframe
            src={embedUrl}
            title={post.title || (post.kind === "reel" ? "Reel de Etérea" : "Publicación de Etérea")}
            loading="lazy"
            allow="autoplay; encrypted-media; picture-in-picture"
            className="h-[620px] w-full border-0"
          />
        </div>
      ) : (
        <button type="button" onClick={() => setOpenedImage(image)} aria-label={`Mostrar ${post.kind === "reel" ? "reel" : "publicación"} de Instagram en esta página`} className="group relative block aspect-[4/5] w-full overflow-hidden bg-pearl text-foreground">
          <img src={image} alt={post.title || "Publicación de Etérea"} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
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
  const products = useContent("products");
  const { homeSections } = useContent("texts");
  const validPosts = visibleInstagramPosts(posts);
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
          <div className="mt-10 grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {validPosts.map((post) => <InstagramCard key={post.id} post={post} products={products} />)}
          </div>
        </>}
      </div>
    </section>
  );
}
