import "server-only";
import { prisma } from "@/server/prisma";
import type { AdminShippingSettings, ShippingSettingsInput } from "@/lib/shipping-settings";
import { decryptShippingPassword, encryptShippingPassword } from "@/server/shipping-crypto";
import type { CorreoArgentinoConfig } from "@/server/correo-argentino-api";

export class ShippingSettingsError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

const empty: AdminShippingSettings = {
  environment: "production", apiUser: "", customerId: "", postalCodeOrigin: "",
  itemWeightGrams: 0, packageWeightGrams: 0, itemHeightCm: 0, packageHeightCm: 0,
  packageWidthCm: 0, packageLengthCm: 0, passwordConfigured: false, configured: false,
  freeShippingThreshold: null, storageReady: true,
};

function missingTable(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2021";
}

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || Buffer.byteLength(value) < 32)
    throw new ShippingSettingsError("Configurá AUTH_SECRET para guardar la contraseña de Correo Argentino.", 503);
  return value;
}

export async function getAdminShippingSettings(): Promise<AdminShippingSettings> {
  try {
    const row = await prisma.shippingSettings.findUnique({ where: { id: 1 } });
    if (!row) return empty;
    const passwordConfigured = !!decryptShippingPassword(row, secret());
    return {
      environment: row.environment === "test" ? "test" : "production",
      apiUser: row.apiUser, customerId: row.customerId, postalCodeOrigin: row.postalCodeOrigin,
      itemWeightGrams: row.itemWeightGrams, packageWeightGrams: row.packageWeightGrams,
      itemHeightCm: row.itemHeightCm, packageHeightCm: row.packageHeightCm,
      packageWidthCm: row.packageWidthCm, packageLengthCm: row.packageLengthCm,
      freeShippingThreshold: row.freeShippingThreshold?.toNumber() ?? null,
      passwordConfigured, configured: passwordConfigured, storageReady: true,
    };
  } catch (error) {
    if (missingTable(error)) return { ...empty, storageReady: false };
    throw error;
  }
}

export async function saveAdminShippingSettings(input: ShippingSettingsInput): Promise<AdminShippingSettings> {
  let existing;
  try {
    existing = await prisma.shippingSettings.findUnique({ where: { id: 1 } });
  } catch (error) {
    if (missingTable(error)) throw new ShippingSettingsError("La configuración de envíos necesita la migración pendiente.", 503);
    throw error;
  }
  if (!input.password && (!existing || input.environment !== existing.environment || input.apiUser !== existing.apiUser))
    throw new ShippingSettingsError("Ingresá la contraseña de la API para este usuario y ambiente.");
  if (!input.password && existing && !decryptShippingPassword(existing, secret()))
    throw new ShippingSettingsError("Volvé a ingresar la contraseña de la API de MiCorreo.");
  const passwordColumns = input.password ? encryptShippingPassword(input.password, secret()) : {
    encryptedPassword: existing!.encryptedPassword, passwordIv: existing!.passwordIv, passwordTag: existing!.passwordTag,
  };
  const data = {
    environment: input.environment, apiUser: input.apiUser, customerId: input.customerId,
    postalCodeOrigin: input.postalCodeOrigin, itemWeightGrams: input.itemWeightGrams,
    packageWeightGrams: input.packageWeightGrams, itemHeightCm: input.itemHeightCm,
    packageHeightCm: input.packageHeightCm, packageWidthCm: input.packageWidthCm,
    packageLengthCm: input.packageLengthCm, freeShippingThreshold: input.freeShippingThreshold,
    ...passwordColumns,
  };
  await prisma.shippingSettings.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
  return getAdminShippingSettings();
}

export async function loadShippingQuoteSettings(): Promise<CorreoArgentinoConfig | null> {
  let row;
  try {
    row = await prisma.shippingSettings.findUnique({ where: { id: 1 } });
  } catch (error) {
    if (missingTable(error)) return null;
    throw error;
  }
  if (!row) return null;
  const password = decryptShippingPassword(row, secret());
  if (!password) throw new ShippingSettingsError("No se pudo leer la contraseña de Correo Argentino. Guardala de nuevo desde Envíos.", 503);
  return {
    base: row.environment === "test"
      ? "https://apitest.correoargentino.com.ar/micorreo/v1"
      : "https://api.correoargentino.com.ar/micorreo/v1",
    user: row.apiUser, password, customerId: row.customerId, origin: row.postalCodeOrigin,
    itemWeight: row.itemWeightGrams, packageWeight: row.packageWeightGrams,
    itemHeight: row.itemHeightCm, packageHeight: row.packageHeightCm,
    width: row.packageWidthCm, length: row.packageLengthCm, revision: row.updatedAt.getTime(),
  };
}

export async function loadStorefrontShippingPolicy(): Promise<{ configured: boolean; freeShippingThreshold: number | null }> {
  try {
    const row = await prisma.shippingSettings.findUnique({
      where: { id: 1 },
      select: { encryptedPassword: true, passwordIv: true, passwordTag: true, freeShippingThreshold: true },
    });
    const authSecret = process.env.AUTH_SECRET;
    const configured = !!row && !!authSecret && Buffer.byteLength(authSecret) >= 32 &&
      !!decryptShippingPassword(row, authSecret);
    return {
      configured,
      freeShippingThreshold: configured ? row.freeShippingThreshold?.toNumber() ?? null : null,
    };
  } catch (error) {
    if (missingTable(error)) return { configured: false, freeShippingThreshold: null };
    throw error;
  }
}
