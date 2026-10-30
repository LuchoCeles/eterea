import type { ReactNode } from "react";
import { ContentProvider } from "@/components/providers/ContentProvider";
import { SiteHeader } from "@/components/store/SiteHeader";
import { StorageNotice } from "@/components/store/StorageNotice";
import { isCurrentUserAdmin } from "@/server/auth";
import { loadStorefrontContent } from "@/server/storefront-content";
import { contentForStorefront } from "@/lib/storefront-projection";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: ReactNode }) {
  const [content, isAdmin] = await Promise.all([loadStorefrontContent(), isCurrentUserAdmin()]);

  return (
    <ContentProvider initialContent={contentForStorefront(content)}>
      <div className="flex min-h-svh flex-col">
        <SiteHeader isAdmin={isAdmin} />
        {children}
      </div>
      <StorageNotice />
    </ContentProvider>
  );
}
