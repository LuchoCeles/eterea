import { createHash } from "node:crypto";

export function paymentPriceId(productId: string, position: number) {
  const productKey = createHash("sha256").update(productId).digest("hex").slice(0, 32);
  return `precio-${productKey}-${position}`;
}
