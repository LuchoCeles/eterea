import "server-only";
import { prisma } from "@/server/prisma";
import type { AdminShippingSettings, ShippingSettingsInput } from "@/lib/shipping-settings";
import type { CorreoArgentinoConfig } from "@/server/correo-argentino-api";

export class ShippingSettingsError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

const empty: AdminShippingSettings = {
  environment: "production", customerId: "", postalCodeOrigin: "",
  itemWeightGrams: 0, packageWeightGrams: 0, itemHeightCm: 0, packageHeightCm: 0,
  packageWidthCm: 0, packageLengthCm: 0, appConfigured: false, configured: false,
  homeDeliveryEnabled: true, branchDeliveryEnabled: true, shippingSurcharge: 0,
  freeShippingThreshold: null, storageReady: true,
};

function missingTable(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error &&
    (error.code === "P2021" || error.code === "P2022");
}

function appCredentials() {
  const user = process.env.CORREO_ARGENTINO_PRODUCTION_APP_USER?.trim();
  const password = process.env.CORREO_ARGENTINO_PRODUCTION_APP_PASSWORD;
  return user && password ? { user, password } : null;
}

export async function getAdminShippingSettings(): Promise<AdminShippingSettings> {
  try {
    const row = await prisma.shippingSettings.findUnique({ where: { id: 1 } });
    if (!row) return { ...empty, appConfigured: !!appCredentials() };
    const appConfigured = !!appCredentials();
    return {
      environment: "production", customerId: row.customerId, postalCodeOrigin: row.postalCodeOrigin,
      itemWeightGrams: row.itemWeightGrams, packageWeightGrams: row.packageWeightGrams,
      itemHeightCm: row.itemHeightCm, packageHeightCm: row.packageHeightCm,
      packageWidthCm: row.packageWidthCm, packageLengthCm: row.packageLengthCm,
      homeDeliveryEnabled: row.homeDeliveryEnabled, branchDeliveryEnabled: row.branchDeliveryEnabled,
      shippingSurcharge: row.shippingSurcharge.toNumber(),
      freeShippingThreshold: row.freeShippingThreshold?.toNumber() ?? null,
      appConfigured, configured: appConfigured && !!row.customerId &&
        (row.homeDeliveryEnabled || row.branchDeliveryEnabled), storageReady: true,
    };
  } catch (error) {
    if (missingTable(error)) return { ...empty, storageReady: false };
    throw error;
  }
}

export async function saveAdminShippingSettings(input: ShippingSettingsInput): Promise<AdminShippingSettings> {
  const data = {
    environment: "production", customerId: input.customerId,
    postalCodeOrigin: input.postalCodeOrigin, itemWeightGrams: input.itemWeightGrams,
    packageWeightGrams: input.packageWeightGrams, itemHeightCm: input.itemHeightCm,
    packageHeightCm: input.packageHeightCm, packageWidthCm: input.packageWidthCm,
    packageLengthCm: input.packageLengthCm, freeShippingThreshold: input.freeShippingThreshold,
    homeDeliveryEnabled: input.homeDeliveryEnabled, branchDeliveryEnabled: input.branchDeliveryEnabled,
    shippingSurcharge: input.shippingSurcharge,
    // Columnas heredadas: se vacían al guardar y ya no se usan para autenticar.
    apiUser: "", encryptedPassword: "", passwordIv: "", passwordTag: "",
  };
  try {
    await prisma.shippingSettings.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
  } catch (error) {
    if (missingTable(error)) throw new ShippingSettingsError("La configuración de envíos necesita la migración pendiente.", 503);
    throw error;
  }
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
  const credentials = appCredentials();
  if (!credentials) throw new ShippingSettingsError("Falta configurar la credencial de aplicación de MiCorreo en el servidor.", 503);
  return {
    base: "https://api.correoargentino.com.ar/micorreo/v1",
    ...credentials, customerId: row.customerId, origin: row.postalCodeOrigin,
    itemWeight: row.itemWeightGrams, packageWeight: row.packageWeightGrams,
    itemHeight: row.itemHeightCm, packageHeight: row.packageHeightCm,
    width: row.packageWidthCm, length: row.packageLengthCm, revision: row.updatedAt.getTime(),
    homeDeliveryEnabled: row.homeDeliveryEnabled, branchDeliveryEnabled: row.branchDeliveryEnabled,
    surcharge: row.shippingSurcharge.toNumber(),
  };
}

export async function loadStorefrontShippingPolicy(): Promise<{
  configured: boolean; freeShippingThreshold: number | null;
  homeDeliveryEnabled: boolean; branchDeliveryEnabled: boolean;
}> {
  try {
    const row = await prisma.shippingSettings.findUnique({
      where: { id: 1 }, select: { customerId: true, freeShippingThreshold: true,
        homeDeliveryEnabled: true, branchDeliveryEnabled: true },
    });
    const configured = !!row?.customerId && !!appCredentials() &&
      (row.homeDeliveryEnabled || row.branchDeliveryEnabled);
    return {
      configured,
      homeDeliveryEnabled: row?.homeDeliveryEnabled ?? true,
      branchDeliveryEnabled: row?.branchDeliveryEnabled ?? true,
      freeShippingThreshold: configured ? row.freeShippingThreshold?.toNumber() ?? null : null,
    };
  } catch (error) {
    if (missingTable(error)) return { configured: false, freeShippingThreshold: null,
      homeDeliveryEnabled: true, branchDeliveryEnabled: true };
    throw error;
  }
}
