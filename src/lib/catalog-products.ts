import { visibleStoreProducts, type StoreCategory, type StoreProduct } from "@/lib/content";
import { sortProductsByCreation } from "@/lib/products";
import { productWithoutOffers, visibleSaleProducts } from "@/lib/storefront-rules";

export function catalogProducts(products: StoreProduct[], categories: StoreCategory[], offersEnabled: boolean) {
  const available = visibleStoreProducts(products, categories);
  const regular = available.filter((product) => product.section === "nuevo");
  const sale = available.filter((product) => product.section === "sale");
  const key = (product: StoreProduct) => `${product.categoryId}|${product.name.toLocaleLowerCase("es-AR")}`;
  const regularKeys = new Set(regular.map(key));
  const discounted = visibleSaleProducts(sale, offersEnabled);
  const discountedKeys = new Set(discounted.map(key));
  const selected = offersEnabled
    ? [...regular.filter((product) => !discountedKeys.has(key(product))), ...discounted]
    : [...regular, ...sale.filter((product) => !regularKeys.has(key(product)))];
  return sortProductsByCreation(selected).map((product) => productWithoutOffers(product, offersEnabled));
}
