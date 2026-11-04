import type { MetadataRoute } from "next";
import { visibleStoreProducts } from "@/lib/content";
import { productHref } from "@/lib/product-slugs";
import { loadStorefrontContent } from "@/server/storefront-content";

export const dynamic = "force-dynamic";

const siteUrl = "https://etereanewconcept.com.ar";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const content = await loadStorefrontContent();
  const products = visibleStoreProducts(content.products, content.categories);

  return [
    { url: `${siteUrl}/` },
    { url: `${siteUrl}/productos` },
    { url: `${siteUrl}/quienes-somos` },
    ...products.map((product) => ({ url: `${siteUrl}${productHref(product, content.products)}` })),
  ];
}
