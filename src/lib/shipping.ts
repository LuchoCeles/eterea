export type ShippingDeliveryType = "D" | "S";

export type ShippingQuote = {
  postalCode: string;
  quantity: number;
  price: number;
  deliveryType: ShippingDeliveryType;
  expiresAt: string;
};

export function shippingDeliveryLabel(deliveryType: ShippingDeliveryType): string {
  return deliveryType === "S" ? "Retiro por sucursal" : "Envío Clásico";
}

export function validPostalCode(value: string): boolean {
  return /^\d{4}$/.test(value);
}

export async function requestShippingQuote(postalCode: string, quantity: number,
  deliveryType: ShippingDeliveryType, signal?: AbortSignal): Promise<ShippingQuote> {
  const response = await fetch("/api/shipping/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ postalCode, quantity, deliveryType }),
    signal,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(typeof data?.error === "string" ? data.error : "No pudimos calcular el envío. Intentá de nuevo.");
  return data as ShippingQuote;
}
