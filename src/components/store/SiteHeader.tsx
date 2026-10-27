"use client";

import { usePathname } from "next/navigation";
import { useCart } from "@/components/providers/CartProvider";
import { useContent } from "@/components/providers/ContentProvider";
import { Header } from "@/components/store/Header";
import { PromoBar } from "@/components/store/PromoBar";
import { catalogProducts } from "@/lib/catalog-products";
import { visibleStoreProducts } from "@/lib/content";
import { productSlug } from "@/lib/product-slugs";
import { hasRealDiscount } from "@/lib/storefront-rules";

export function SiteHeader({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname().replace(/\/+$/, "") || "/";
  const { items, addAnimationKey, changeQuantity, remove } = useCart();
  const products = useContent("products");
  const categories = useContent("categories");
  const { offers, homeSections } = useContent("texts");
  const contact = useContent("contact");
  const visibleProducts = visibleStoreProducts(products, categories);
  const hasNewArrivals = visibleProducts.some((product) => product.section === "nuevo");
  const hasSale = homeSections.sale && catalogProducts(products, categories, offers.enabled).some(hasRealDiscount);
  const productPath = pathname.startsWith("/productos/") && pathname.split("/").length === 3;
  const isKnownProduct = productPath && visibleProducts.some((product) => (
    pathname === `/productos/${productSlug(product, products)}` || pathname === `/productos/${product.id}`
  ));
  const isStorePage = ["/", "/auth", "/productos", "/quienes-somos"].includes(pathname) || isKnownProduct;

  if (!isStorePage) return null;

  return (
    <div className="sticky top-0 z-40">
      {homeSections.promoBar && <PromoBar />}
      <Header
        cartItems={items}
        cartAddCount={addAnimationKey}
        whatsappNumber={contact.whatsapp}
        onQuantityChange={changeQuantity}
        onRemove={remove}
        homeSections={{ ...homeSections, newArrivals: homeSections.newArrivals && hasNewArrivals }}
        hasSale={hasSale}
        isAdmin={isAdmin}
      />
    </div>
  );
}
