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
  const posts = connectedToEterea
    ? visibleInstagramPosts((await loadRecentInstagramPosts()) ?? [])
    : visibleInstagramPosts(content.instagram);
  const instagramMediaAssets = connectedToEterea ? await loadInstagramMediaAssets(posts, true) : {};
  const covers = Object.fromEntries(Object.entries(instagramMediaAssets).map(([url, asset]) => [url, {
    imageUrl: asset.imageUrl, posterUrl: asset.posterUrl,
  }]));
  return <InstagramSection posts={posts} mediaAssets={covers} />;
}
