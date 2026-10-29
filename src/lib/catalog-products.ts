import { visibleStoreProducts, type StoreCategory, type StoreProduct } from "@/lib/content";
import { isProductSoldOut, sortProductsByCreation, type Product } from "@/lib/products";
import { hasRealDiscount, productWithoutOffers, visibleSaleProducts } from "@/lib/storefront-rules";

export function catalogProducts(products: StoreProduct[], categories: StoreCategory[], offersEnabled: boolean) {
  const available = visibleStoreProducts(products, categories);
  const regular = available.filter((product) => product.section !== "sale");
  const sale = available.filter((product) => product.section === "sale");
  const key = (product: StoreProduct) => `${product.categoryId}|${product.name.toLocaleLowerCase("es-AR")}`;
  const regularKeys = new Set(regular.map(key));
  const discounted = visibleSaleProducts(sale, offersEnabled);
  const discountedKeys = new Set(discounted.map(key));
  const selected = offersEnabled
    ? [...regular.filter((product) => !discountedKeys.has(key(product))), ...sale.filter((product) => hasRealDiscount(product) || !regularKeys.has(key(product)))]
    : [...regular, ...sale.filter((product) => !regularKeys.has(key(product)))];
  return sortProductsByCreation(selected).map((product) => productWithoutOffers(product, offersEnabled));
}

export function homeProducts(products: StoreProduct[], offersEnabled: boolean) {
  const featured = products.filter((product) => product.section === "nuevo" || product.section === "sale");
  return {
    newArrivals: featured.filter((product) => product.section === "nuevo" && (!offersEnabled || !hasRealDiscount(product)))
      .map((product) => productWithoutOffers(product, offersEnabled)),
    sale: visibleSaleProducts(featured, offersEnabled),
  };
}

export function sortProductsByAvailability<T extends Product>(products: T[]): T[] {
  return [...products].sort((a, b) => Number(isProductSoldOut(a)) - Number(isProductSoldOut(b)));
}
