import type { ReactNode } from "react";
import { ContentProvider } from "@/components/providers/ContentProvider";
import { ShippingPolicyProvider } from "@/components/providers/ShippingPolicyProvider";
import { SiteHeader } from "@/components/store/SiteHeader";
import { StorageNotice } from "@/components/store/StorageNotice";
import { isCurrentUserAdmin } from "@/server/auth";
import { loadStorefrontContent } from "@/server/storefront-content";
import { contentForStorefront } from "@/lib/storefront-projection";
import { loadFreeShippingThreshold } from "@/server/shipping-settings";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: ReactNode }) {
  const [content, isAdmin, freeShippingThreshold] = await Promise.all([
    loadStorefrontContent(), isCurrentUserAdmin(), loadFreeShippingThreshold(),
  ]);
  const storefrontContent = contentForStorefront(content);
  const activeThreshold = storefrontContent.texts.offers.enabled ? freeShippingThreshold : null;

  return (
    <ShippingPolicyProvider threshold={activeThreshold}>
      <ContentProvider initialContent={storefrontContent}>
        <div className="flex min-h-svh flex-col">
          <SiteHeader isAdmin={isAdmin} />
          {children}
        </div>
        <StorageNotice />
      </ContentProvider>
    </ShippingPolicyProvider>
  );
}
