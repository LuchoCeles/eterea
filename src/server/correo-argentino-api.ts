import type { ShippingDeliveryType, ShippingQuote } from "@/lib/shipping";

export class CorreoArgentinoError extends Error {}

export type CorreoArgentinoConfig = {
  base: string;
  user: string;
  password: string;
  customerId: string;
  origin: string;
  itemWeight: number;
  packageWeight: number;
  itemHeight: number;
  packageHeight: number;
  width: number;
  length: number;
  revision: number;
};

let cachedToken: { key: string; value: string; expiresAt: number } | undefined;
const cachedQuotes = new Map<string, ShippingQuote>();

async function getToken(settings: CorreoArgentinoConfig): Promise<string> {
  const key = `${settings.base}:${settings.user}:${settings.revision}`;
  if (cachedToken?.key === key && cachedToken.expiresAt > Date.now()) return cachedToken.value;
  const response = await fetch(`${settings.base}/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${settings.user}:${settings.password}`).toString("base64")}` },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!response.ok) throw new CorreoArgentinoError("No se pudo autenticar con Correo Argentino.");
  const body = await response.json() as { token?: unknown };
  if (typeof body.token !== "string" || !body.token) throw new CorreoArgentinoError("Correo Argentino no devolvió una sesión válida.");
  let expiresAt = Date.now() + 10 * 60_000;
  try {
    const payload = JSON.parse(Buffer.from(body.token.split(".")[1], "base64url").toString("utf8")) as { exp?: number };
    if (typeof payload.exp === "number") expiresAt = Math.min(expiresAt, payload.exp * 1000 - 60_000);
  } catch { /* Se usa el vencimiento conservador. */ }
  cachedToken = { key, value: body.token, expiresAt };
  return body.token;
}

export async function quoteCorreoArgentinoApi(settings: CorreoArgentinoConfig, postalCode: string, quantity: number,
  deliveryType: ShippingDeliveryType): Promise<ShippingQuote> {
  const weight = settings.packageWeight + settings.itemWeight * quantity;
  const height = settings.packageHeight + settings.itemHeight * quantity;
  if (weight > 25_000 || height > 150 || settings.width > 150 || settings.length > 150)
    throw new CorreoArgentinoError("El pedido supera las medidas admitidas para cotizar el envío. Escribinos para coordinarlo.");
  const key = `${settings.base}:${settings.customerId}:${settings.revision}:${settings.origin}:${postalCode}:${deliveryType}:${weight}:${height}:${settings.width}:${settings.length}`;
  const cached = cachedQuotes.get(key);
  if (cached && Date.parse(cached.expiresAt) > Date.now()) return cached;

  async function fetchRates(token: string) {
    return fetch(`${settings.base}/rates`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: settings.customerId,
        postalCodeOrigin: settings.origin,
        postalCodeDestination: postalCode,
        deliveredType: deliveryType,
        dimensions: { weight, height, width: settings.width, length: settings.length },
      }),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
  }

  let response = await fetchRates(await getToken(settings));
  if (response.status === 401) {
    cachedToken = undefined;
    response = await fetchRates(await getToken(settings));
  }
  if (!response.ok) throw new CorreoArgentinoError("Correo Argentino no pudo cotizar este envío. Intentá de nuevo más tarde.");
  const body = await response.json() as { validTo?: unknown; rates?: unknown };
  const rates = Array.isArray(body.rates) ? body.rates : [];
  const rate = rates
    .filter((item) => item?.deliveredType === deliveryType && item.productType === "CP" && typeof item.price === "number" &&
      Number.isFinite(item.price) && item.price >= 0)
    .sort((a, b) => a.price - b.price)[0];
  if (!rate) throw new CorreoArgentinoError(deliveryType === "S"
    ? "Correo Argentino no ofrece entrega en sucursal para ese código postal."
    : "Correo Argentino no ofrece envío Clásico a domicilio para ese código postal.");
  const validTo = typeof body.validTo === "string" ? Date.parse(body.validTo) : NaN;
  const expiresAt = new Date(Math.min(Date.now() + 5 * 60_000, Number.isFinite(validTo) ? validTo : Infinity)).toISOString();
  const quote: ShippingQuote = { postalCode, quantity, price: rate.price as number, deliveryType, expiresAt };
  if (cachedQuotes.size >= 200) cachedQuotes.clear();
  cachedQuotes.set(key, quote);
  return quote;
}
