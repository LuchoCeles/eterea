import type { ReactNode } from "react";
import { ContentProvider } from "@/components/providers/ContentProvider";
import { SiteHeader } from "@/components/store/SiteHeader";
import { isCurrentUserAdmin } from "@/server/auth";
import { loadStorefrontContent } from "@/server/storefront-content";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: ReactNode }) {
  const [content, isAdmin] = await Promise.all([loadStorefrontContent(), isCurrentUserAdmin()]);

  return (
    <ContentProvider initialContent={content}>
      <div className="min-h-screen">
        <SiteHeader isAdmin={isAdmin} />
        {children}
      </div>
    </ContentProvider>
  );
}
