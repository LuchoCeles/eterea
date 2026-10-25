import { Storefront } from "@/components/store/Storefront";
import { ContentProvider } from "@/components/providers/ContentProvider";
import { loadContentSnapshot } from "@/server/content";
import { isInstagramEmbedUnavailable, loadInstagramMediaAssets, loadInstagramProfile, loadRecentInstagramPosts } from "@/server/instagram";
import { isCurrentUserAdmin } from "@/server/auth";
import { visibleInstagramPosts } from "@/lib/storefront-rules";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [content, isAdmin, profile] = await Promise.all([
    loadContentSnapshot(),
    isCurrentUserAdmin(),
    loadInstagramProfile(),
  ]);
  if (profile) content.contact = { ...content.contact, instagramUsername: profile.username };
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
      <Storefront isAdmin={isAdmin} unavailableInstagramUrls={unavailableInstagramUrls} instagramMediaAssets={instagramMediaAssets} />
    </ContentProvider>
  );
}
