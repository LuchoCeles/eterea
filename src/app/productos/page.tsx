import type { Metadata } from "next";
import { CatalogPage } from "@/components/store/CatalogPage";
import { ContentProvider } from "@/components/providers/ContentProvider";
import { loadStorefrontContent } from "@/server/storefront-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Prendas | Etérea",
  description: "Descubrí todas las prendas de Etérea y elegí cómo querés pagar.",
};

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ categoria?: string | string[] }> }) {
  const [content, params] = await Promise.all([loadStorefrontContent(), searchParams]);
  const requestedCategory = Array.isArray(params.categoria) ? params.categoria[0] : params.categoria;

  return (
    <ContentProvider initialContent={content}>
      <CatalogPage initialCategory={requestedCategory ?? ""} />
    </ContentProvider>
  );
}
