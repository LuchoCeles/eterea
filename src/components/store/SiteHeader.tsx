"use client";

import { usePathname } from "next/navigation";
import { useCart } from "@/components/providers/CartProvider";
import { useContent } from "@/components/providers/ContentProvider";
import { Header } from "@/components/store/Header";
import { PromoBar } from "@/components/store/PromoBar";
import { homeProducts } from "@/lib/catalog-products";
import { visibleStoreProducts } from "@/lib/content";
import { productSlug } from "@/lib/product-slugs";

export function SiteHeader({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname().replace(/\/+$/, "") || "/";
  const { items, addAnimationKey, changeQuantity, remove } = useCart();
  const products = useContent("products");
  const categories = useContent("categories");
  const { homeSections } = useContent("texts");
  const contact = useContent("contact");
  const visibleProducts = visibleStoreProducts(products, categories);
  const { newArrivals, sale } = homeProducts(visibleProducts);
  const hasNewArrivals = newArrivals.length > 0;
  const hasSale = homeSections.sale && sale.length > 0;
  const productPath = pathname.startsWith("/productos/") && pathname.split("/").length === 3;
  const isKnownProduct = productPath && visibleProducts.some((product) => (
    pathname === `/productos/${productSlug(product, products)}` || pathname === `/productos/${product.id}`
  ));
  const isStorePage = ["/", "/auth", "/productos", "/quienes-somos"].includes(pathname) || isKnownProduct;

  if (!isStorePage) return null;

  return (
    <div
      className={`sticky top-0 z-40 ${pathname === "/" ? "no-native-drag" : ""}`}
      onDragStart={pathname === "/" ? (event) => event.preventDefault() : undefined}
    >
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
