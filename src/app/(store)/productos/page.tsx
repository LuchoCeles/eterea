import type { Metadata } from "next";
import { CatalogPage } from "@/components/store/CatalogPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Prendas | Etérea",
  description: "Descubrí todas las prendas de Etérea y elegí cómo querés pagar.",
};

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ categoria?: string | string[] }> }) {
  const params = await searchParams;
  const requestedCategory = Array.isArray(params.categoria) ? params.categoria[0] : params.categoria;

  return <CatalogPage initialCategory={requestedCategory ?? ""} />;
}
