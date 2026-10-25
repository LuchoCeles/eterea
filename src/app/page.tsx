import { Storefront } from "@/components/store/Storefront";
import { ContentProvider } from "@/components/providers/ContentProvider";
import { loadContentSnapshot } from "@/server/content";
import { loadRecentInstagramPosts } from "@/server/instagram";
import { isCurrentUserAdmin } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [content, recentPosts, isAdmin] = await Promise.all([
    loadContentSnapshot(),
    loadRecentInstagramPosts(),
    isCurrentUserAdmin(),
  ]);
  if (recentPosts?.length) content.instagram = recentPosts;
  return (
    <ContentProvider initialContent={content}>
      <Storefront isAdmin={isAdmin} />
    </ContentProvider>
  );
}
