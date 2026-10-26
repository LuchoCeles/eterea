"use client";

import { useCart } from "@/components/providers/CartProvider";
import { useContent } from "@/components/providers/ContentProvider";
import { Header } from "@/components/store/Header";
import { PromoBar } from "@/components/store/PromoBar";
import { catalogProducts } from "@/lib/catalog-products";
import { visibleStoreProducts } from "@/lib/content";
import { hasRealDiscount } from "@/lib/storefront-rules";

export function ProductsHeader({ isAdmin }: { isAdmin: boolean }) {
  const { items, addAnimationKey, changeQuantity, remove } = useCart();
  const products = useContent("products");
  const categories = useContent("categories");
  const { offers, homeSections } = useContent("texts");
  const contact = useContent("contact");
  const hasNewArrivals = visibleStoreProducts(products, categories).some((product) => product.section === "nuevo");
  const hasSale = homeSections.sale && catalogProducts(products, categories, offers.enabled).some(hasRealDiscount);

  return (
    <div className="sticky top-0 z-40">
      {homeSections.promoBar && <PromoBar />}
      <Header cartItems={items} cartAddCount={addAnimationKey} whatsappNumber={contact.whatsapp} onQuantityChange={changeQuantity} onRemove={remove} homeSections={{ ...homeSections, newArrivals: homeSections.newArrivals && hasNewArrivals }} hasSale={hasSale} isAdmin={isAdmin} />
    </div>
  );
}
