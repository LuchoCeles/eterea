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
  homeDeliveryEnabled: boolean;
  branchDeliveryEnabled: boolean;
  surcharge: number;
  revision: number;
};

let cachedToken: { key: string; value: string; expiresAt: number } | undefined;
const cachedQuotes = new Map<string, ShippingQuote>();
const QUOTE_VALIDITY_MS = 12 * 60 * 60_000;

async function requestCorreo(url: string, init: RequestInit): Promise<Response> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await fetch(url, { ...init, signal: AbortSignal.timeout(8000) });
    } catch (error) {
      if (attempt === 1 || !(error instanceof TypeError))
        throw new CorreoArgentinoError("No pudimos comunicarnos con Correo Argentino. Intentá de nuevo.");
    }
  }
  throw new CorreoArgentinoError("No pudimos comunicarnos con Correo Argentino. Intentá de nuevo.");
}

async function getToken(settings: CorreoArgentinoConfig): Promise<string> {
  const key = `${settings.base}:${settings.user}:${settings.password}:${settings.revision}`;
  if (cachedToken?.key === key && cachedToken.expiresAt > Date.now()) return cachedToken.value;
  const response = await requestCorreo(`${settings.base}/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${settings.user}:${settings.password}`).toString("base64")}`,
      Accept: "application/json", "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  if (!response.ok) throw new CorreoArgentinoError("No se pudo autenticar con Correo Argentino.");
  const body = await response.json() as { token?: unknown; expire?: unknown; expires?: unknown };
  if (typeof body.token !== "string" || !body.token) throw new CorreoArgentinoError("Correo Argentino no devolvió una sesión válida.");
  let expiresAt = Date.now() + 60 * 60_000;
  const apiExpiration = body.expire ?? body.expires;
  if (typeof apiExpiration === "string") {
    const parsed = Date.parse(apiExpiration);
    if (Number.isFinite(parsed)) expiresAt = Math.min(expiresAt, parsed - 60_000);
  }
  try {
    const payload = JSON.parse(Buffer.from(body.token.split(".")[1], "base64url").toString("utf8")) as { exp?: number };
    if (typeof payload.exp === "number") expiresAt = Math.min(expiresAt, payload.exp * 1000 - 60_000);
  } catch { /* Se conserva el vencimiento informado por la API. */ }
  cachedToken = { key, value: body.token, expiresAt };
  return body.token;
}

export async function quoteCorreoArgentinoApi(settings: CorreoArgentinoConfig, postalCode: string, quantity: number,
  deliveryType: ShippingDeliveryType): Promise<ShippingQuote> {
  if (deliveryType === "D" ? !settings.homeDeliveryEnabled : !settings.branchDeliveryEnabled)
    throw new CorreoArgentinoError("Este tipo de entrega no está habilitado en la tienda.");
  const weight = settings.packageWeight + settings.itemWeight * quantity;
  const height = settings.packageHeight + settings.itemHeight * quantity;
  if (weight > 25_000 || height > 150 || settings.width > 150 || settings.length > 150)
    throw new CorreoArgentinoError("El pedido supera las medidas admitidas para cotizar el envío. Escribinos para coordinarlo.");
  const key = `${settings.base}:${settings.customerId}:${settings.revision}:${settings.origin}:${postalCode}:${deliveryType}:${weight}:${height}:${settings.width}:${settings.length}`;
  const cached = cachedQuotes.get(key);
  if (cached && Date.parse(cached.expiresAt) > Date.now()) return cached;

  async function fetchRates(token: string) {
    return requestCorreo(`${settings.base}/rates`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: settings.customerId,
        postalCodeOrigin: settings.origin,
        postalCodeDestination: postalCode,
        deliveredType: deliveryType,
        dimensions: { weight, height, width: settings.width, length: settings.length },
      }),
      cache: "no-store",
    });
  }

  let response = await fetchRates(await getToken(settings));
  if (response.status === 401 || response.status === 403) {
    cachedToken = undefined;
    response = await fetchRates(await getToken(settings));
  }
  if (response.status === 402) throw new CorreoArgentinoError("El ID de cliente de MiCorreo no es válido. Revisalo en Envíos.");
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
  // La vigencia local empieza al recibir la tarifa; validTo puede estar por vencer
  // y haría desaparecer una cotización recién mostrada en el navegador.
  const expiresAt = new Date(Date.now() + QUOTE_VALIDITY_MS).toISOString();
  const price = (Math.round(rate.price * 100) + Math.round(settings.surcharge * 100)) / 100;
  const quote: ShippingQuote = { postalCode, quantity, price, deliveryType, expiresAt };
  if (cachedQuotes.size >= 200) cachedQuotes.clear();
  cachedQuotes.set(key, quote);
  return quote;
}
