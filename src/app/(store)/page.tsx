import { Storefront } from "@/components/store/Storefront";
import { ContentProvider } from "@/components/providers/ContentProvider";
import { loadRecentInstagramPosts, loadInstagramMediaAssets, isInstagramEmbedUnavailable } from "@/server/instagram";
import { loadStorefrontContent } from "@/server/storefront-content";
import { visibleInstagramPosts } from "@/lib/storefront-rules";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const content = await loadStorefrontContent();
  if (!visibleInstagramPosts(content.instagram).length) {
    const recentPosts = await loadRecentInstagramPosts();
    if (recentPosts?.length) content.instagram = recentPosts;
  }
  const validPosts = visibleInstagramPosts(content.instagram);
  const instagramMediaAssets = await loadInstagramMediaAssets(validPosts);
  const unavailableChecks = await Promise.all(validPosts.filter((post) => !instagramMediaAssets[post.url]).map(async (post) => ({
    url: post.url,
    unavailable: await isInstagramEmbedUnavailable(post.url),
  })));
  const unavailableInstagramUrls = unavailableChecks.filter((post) => post.unavailable).map((post) => post.url);
  return (
    <ContentProvider initialContent={content}>
      <Storefront unavailableInstagramUrls={unavailableInstagramUrls} instagramMediaAssets={instagramMediaAssets} />
    </ContentProvider>
  );
}
