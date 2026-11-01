export type ShippingQuote = {
  postalCode: string;
  quantity: number;
  price: number;
  service: string;
  expiresAt: string;
};

export function validPostalCode(value: string): boolean {
  return /^\d{4}$/.test(value);
}

export async function requestShippingQuote(postalCode: string, quantity: number, signal?: AbortSignal): Promise<ShippingQuote> {
  const response = await fetch("/api/shipping/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ postalCode, quantity }),
    signal,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(typeof data?.error === "string" ? data.error : "No pudimos calcular el envío. Intentá de nuevo.");
  return data as ShippingQuote;
}
