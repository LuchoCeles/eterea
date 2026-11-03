"use server";

import { shippingSettingsSchema, type ShippingSettingsInput } from "@/lib/shipping-settings";
import { isCurrentUserAdmin } from "@/server/auth";
import { saveAdminShippingSettings, ShippingSettingsError } from "@/server/shipping-settings";

export async function saveShippingSettingsAction(input: ShippingSettingsInput) {
  if (!(await isCurrentUserAdmin())) return { error: "No autorizado." };
  const parsed = shippingSettingsSchema.safeParse(input);
  if (!parsed.success) return { error: "Completá todos los datos requeridos con valores válidos." };
  try {
    return { data: await saveAdminShippingSettings(parsed.data) };
  } catch (error) {
    return { error: error instanceof ShippingSettingsError ? error.message : "No se pudo guardar la configuración de envíos." };
  }
}

