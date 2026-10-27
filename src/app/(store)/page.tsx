import { Suspense } from "react";
import { Storefront } from "@/components/store/Storefront";
import { InstagramSection } from "@/components/store/InstagramSection";
import { loadRecentInstagramPosts, loadInstagramMediaAssets } from "@/server/instagram";
import { loadStorefrontData } from "@/server/storefront-content";
import { visibleInstagramPosts } from "@/lib/storefront-rules";
import type { ContentSnapshot } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { content, instagramConnected } = await loadStorefrontData();
  return <Storefront instagramSection={content.texts.homeSections.instagram ? (
    <Suspense fallback={<section className="min-h-60 border-t bg-sea" aria-hidden="true" />}>
      <InstagramContent content={content} instagramConnected={instagramConnected} />
    </Suspense>
  ) : null} />;
}

async function InstagramContent({ content, instagramConnected }: { content: ContentSnapshot; instagramConnected: boolean }) {
  const connectedToEterea = instagramConnected && content.contact.instagramUsername.toLowerCase() === "eterea.newconcept";
  let posts = visibleInstagramPosts(content.instagram);
  if (!posts.length && connectedToEterea) {
    posts = visibleInstagramPosts((await loadRecentInstagramPosts()) ?? []);
  }
  const instagramMediaAssets = connectedToEterea ? await loadInstagramMediaAssets(posts.slice(0, 12)) : {};
  return <InstagramSection posts={posts} mediaAssets={instagramMediaAssets} />;
}
