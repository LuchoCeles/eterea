import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ProductDetail } from "@/components/store/ProductDetail";
import { catalogProducts } from "@/lib/catalog-products";
import { visibleStoreProducts, type ContentSnapshot } from "@/lib/content";
import { productHref, productSlug } from "@/lib/product-slugs";
import { loadStorefrontContent } from "@/server/storefront-content";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

function findProduct(segment: string, content: ContentSnapshot) {
  const visible = visibleStoreProducts(content.products, content.categories);
  return visible.find((item) => productSlug(item, content.products) === segment)
    ?? visible.find((item) => item.id === segment);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const content = await loadStorefrontContent();
  const product = findProduct(slug, content);
  return product ? {
    title: `${product.name} | Etérea`,
    description: product.description?.trim() || `Descubrí ${product.name} en Etérea. Consultá talles, colores y formas de pago.`,
    openGraph: { title: `${product.name} | Etérea`, images: product.image ? [product.image] : undefined },
  } : { title: "Prenda no disponible | Etérea" };
}

export default async function ProductPage({ params }: PageProps) {
  const [{ slug }, content] = await Promise.all([params, loadStorefrontContent()]);
  const source = findProduct(slug, content);
  if (!source) notFound();
  if (slug !== productSlug(source, content.products)) redirect(productHref(source, content.products));

  const related = catalogProducts(content.products, content.categories)
    .filter((item) => item.id !== source.id)
    .sort((a, b) => Number(b.categoryId === source.categoryId) - Number(a.categoryId === source.categoryId))
    .slice(0, 4);

  return <ProductDetail source={source} relatedIds={related.map((item) => item.id)} />;
}
