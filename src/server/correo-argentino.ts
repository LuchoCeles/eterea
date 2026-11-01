import "server-only";
import type { ShippingQuote } from "@/lib/shipping";
import { CorreoArgentinoError, quoteCorreoArgentinoApi } from "@/server/correo-argentino-api";
import { loadShippingQuoteSettings, ShippingSettingsError } from "@/server/shipping-settings";

export { CorreoArgentinoError } from "@/server/correo-argentino-api";

export async function quoteCorreoArgentino(postalCode: string, quantity: number): Promise<ShippingQuote> {
  let settings;
  try {
    settings = await loadShippingQuoteSettings();
  } catch (error) {
    if (error instanceof ShippingSettingsError) throw new CorreoArgentinoError(error.message);
    throw error;
  }
  if (!settings) throw new CorreoArgentinoError("La cotización de Correo Argentino todavía no está configurada.");
  return quoteCorreoArgentinoApi(settings, postalCode, quantity);
}
