import { Suspense } from "react";
import { Storefront } from "@/components/store/Storefront";
import { InstagramSection } from "@/components/store/InstagramSection";
import { loadRecentInstagramPosts, loadInstagramMediaAssets, isInstagramEmbedUnavailable } from "@/server/instagram";
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
  let posts = visibleInstagramPosts(content.instagram);
  if (!posts.length && instagramConnected) {
    posts = visibleInstagramPosts((await loadRecentInstagramPosts()) ?? []);
  }
  const instagramMediaAssets = instagramConnected ? await loadInstagramMediaAssets(posts) : {};
  const unavailableChecks = await Promise.all(posts.filter((post) => !instagramMediaAssets[post.url]).map(async (post) => ({
    url: post.url,
    unavailable: await isInstagramEmbedUnavailable(post.url),
  })));
  const unavailableInstagramUrls = unavailableChecks.filter((post) => post.unavailable).map((post) => post.url);
  return <InstagramSection posts={posts} unavailableUrls={unavailableInstagramUrls} mediaAssets={instagramMediaAssets} />;
}
