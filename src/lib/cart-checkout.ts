import { formatPrice, type CartItem } from "./products";
import { shippingDeliveryLabel, type ShippingDeliveryType, type ShippingQuote } from "./shipping";

export type CartPaymentOption = { key: string; label: string };

function paymentKey(label: string): string {
  return label.trim().toLocaleLowerCase("es-AR");
}

export function availableCartPayments(items: CartItem[]): CartPaymentOption[] {
  const configured = items.filter((item) => item.paymentPrices?.length);
  if (!configured.length) return [];

  const first = configured[0].paymentPrices ?? [];
  const seen = new Set<string>();
  return first.flatMap((payment) => {
    const key = paymentKey(payment.label);
    if (!key || seen.has(key) || !Number.isFinite(payment.price)) return [];
    seen.add(key);
    return configured.every((item) => item.paymentPrices?.some((candidate) =>
      paymentKey(candidate.label) === key && Number.isFinite(candidate.price),
    )) ? [{ key, label: payment.label.trim() }] : [];
  });
}

export function cartCheckout(items: CartItem[], payment?: CartPaymentOption, shipping?: ShippingQuote,
  freeShippingThreshold: number | null = null, shippingConfigured = false,
  deliveryType: ShippingDeliveryType = "D") {
  const quantity = items.reduce((amount, item) => amount + item.quantity, 0);
  const validShipping = shippingConfigured && shipping && shipping.deliveryType === deliveryType &&
    shipping.quantity === quantity && Date.parse(shipping.expiresAt) > Date.now()
    ? shipping : undefined;
  const lines = items.map((item) => {
    const selectedPrice = payment && item.paymentPrices?.find((candidate) => paymentKey(candidate.label) === payment.key);
    const unitPrice = selectedPrice?.price ?? item.price;
    return { item, unitPrice, discounted: unitPrice < item.price, total: unitPrice * item.quantity };
  });
  const baseTotal = items.reduce((amount, item) => amount + item.price * item.quantity, 0);
  const productsTotal = lines.reduce((amount, line) => amount + line.total, 0);
  const discount = Math.max(0, baseTotal - productsTotal);
  const amountUntilFreeShipping = !shippingConfigured || freeShippingThreshold === null ? null
    : Math.max(0, (Math.round(freeShippingThreshold * 100) - Math.round(productsTotal * 100)) / 100);
  const freeShipping = !!validShipping && amountUntilFreeShipping === 0;
  const shippingPrice = validShipping ? (freeShipping ? 0 : validShipping.price) : null;
  const total = productsTotal + (shippingPrice ?? 0);
  const message = [
    "Hola, quiero comprar estas prendas de Etérea:",
    "",
    ...lines.map(({ item, unitPrice, total: lineTotal }) =>
      "• " + item.name + " (" + [item.category, item.size && `talle ${item.size}`, item.color && `color ${item.color}`].filter(Boolean).join(", ") + ") — " + item.quantity + " × " + formatPrice(unitPrice) + " = " + formatPrice(lineTotal),
    ),
    "",
    ...(payment ? [`Medio de pago: ${payment.label}`] : []),
    ...(discount ? [`Subtotal: ${formatPrice(baseTotal)}`, `Descuento: -${formatPrice(discount)}`] : []),
    ...(validShipping ? [`Prendas: ${formatPrice(productsTotal)}`] : []),
    ...(validShipping
      ? [`${shippingDeliveryLabel(validShipping.deliveryType)}: ${freeShipping ? "Gratis" : formatPrice(validShipping.price)}`]
      : shippingConfigured ? [`${shippingDeliveryLabel(deliveryType)}: a cotizar (no incluido en el total)`] : []),
    `${validShipping ? "Total a pagar" : "Total de prendas"}: ${formatPrice(total)}`,
  ].join("\n");

  return { lines, baseTotal, productsTotal, total, discount, shippingPrice, freeShipping,
    amountUntilFreeShipping, message };
}
