import type { ReactNode } from "react";
import { ContentProvider } from "@/components/providers/ContentProvider";
import { ProductsHeader } from "@/components/store/ProductsHeader";
import { isCurrentUserAdmin } from "@/server/auth";
import { loadStorefrontContent } from "@/server/storefront-content";

export const dynamic = "force-dynamic";

export default async function ProductsLayout({ children }: { children: ReactNode }) {
  const [content, isAdmin] = await Promise.all([loadStorefrontContent(), isCurrentUserAdmin()]);

  return (
    <ContentProvider initialContent={content}>
      <div className="min-h-screen">
        <ProductsHeader isAdmin={isAdmin} />
        {children}
      </div>
    </ContentProvider>
  );
}
