import { formatPrice, type Product } from "@/lib/products";
import { hasRealDiscount } from "@/lib/storefront-rules";

type PriceProduct = Pick<Product, "price" | "oldPrice" | "paymentPrices">;

export function ProductDetailPrice({ product }: { product: PriceProduct }) {
  const paymentPrices = product.paymentPrices ?? [];
  const basePaymentIndex = paymentPrices.findIndex((payment) => payment.price === product.price);
  const basePayment = paymentPrices[basePaymentIndex];
  const additionalPayments = paymentPrices.filter((payment, index) =>
    index !== basePaymentIndex && Number.isFinite(payment.price) && payment.price > 0,
  );
  const cheapestPayment = additionalPayments.reduce<(typeof additionalPayments)[number] | null>(
    (cheapest, payment) => payment.price < product.price && (!cheapest || payment.price < cheapest.price)
      ? payment
      : cheapest,
    null,
  );
  const otherPayments = additionalPayments.filter((payment) => payment !== cheapestPayment);

  return (
    <div className="mt-6 border-b pb-7 tabular-nums">
      {hasRealDiscount(product) && (
        <p className="text-sm text-muted-foreground line-through">
          {formatPrice(product.oldPrice ?? product.price)}
        </p>
      )}
      <p className="mt-1 text-2xl font-medium leading-tight">
        {formatPrice(product.price)}
        {basePayment && <span className="ml-2 text-sm font-normal text-muted-foreground">con {basePayment.label}</span>}
      </p>
      {cheapestPayment && (
        <p className="mt-3 break-words text-3xl font-semibold leading-tight text-accent sm:text-4xl">
          {formatPrice(cheapestPayment.price)}{" "}
          <span className="text-xl font-medium sm:text-2xl">con {cheapestPayment.label}</span>
        </p>
      )}
      {otherPayments.length > 0 && (
        <dl className="mt-4 space-y-1 text-sm text-muted-foreground">
          {otherPayments.map((payment, index) => (
            <div key={`${payment.label}-${index}`} className="flex flex-wrap justify-between gap-x-4">
              <dt>{payment.label}</dt>
              <dd>{formatPrice(payment.price)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
