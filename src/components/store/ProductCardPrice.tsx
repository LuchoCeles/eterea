import { formatPrice, type Product } from "@/lib/products";
import { hasRealDiscount } from "@/lib/storefront-rules";

export function ProductCardPrice({ product }: { product: Product }) {
  const discounted = hasRealDiscount(product);
  const discount = discounted ? Math.round((1 - product.price / (product.oldPrice ?? product.price)) * 100) : 0;
  const paymentPrices = product.paymentPrices ?? [];
  const cheapestPayment = paymentPrices.length >= 2
    ? paymentPrices.reduce((cheapest, payment) => payment.price < cheapest.price ? payment : cheapest)
    : null;

  return (
    <div className="mt-3 min-w-0 tabular-nums">
      {discounted && <p className="text-xs text-muted-foreground line-through">{formatPrice(product.oldPrice ?? product.price)}</p>}
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <p className={`text-base font-medium ${discounted ? "text-accent" : ""}`}>{formatPrice(product.price)}</p>
        {discounted && <span className="text-xs font-semibold text-accent">{discount}% OFF</span>}
      </div>
      {cheapestPayment && (
        <p className="mt-1.5 break-words text-sm font-medium leading-snug text-accent">
          {formatPrice(cheapestPayment.price)} <span className="font-normal">con {cheapestPayment.label}</span>
        </p>
      )}
    </div>
  );
}
