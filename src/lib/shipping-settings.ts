import { z } from "zod";

export const shippingSettingsSchema = z.object({
  environment: z.literal("production"),
  customerId: z.string().trim().regex(/^\d{1,32}$/),
  postalCodeOrigin: z.string().regex(/^\d{4}$/),
  itemWeightGrams: z.number().int().min(1).max(25_000),
  packageWeightGrams: z.number().int().min(1).max(25_000),
  itemHeightCm: z.number().int().min(1).max(150),
  packageHeightCm: z.number().int().min(1).max(150),
  packageWidthCm: z.number().int().min(1).max(150),
  packageLengthCm: z.number().int().min(1).max(150),
  homeDeliveryEnabled: z.boolean(),
  branchDeliveryEnabled: z.boolean(),
  shippingSurcharge: z.number().finite().min(0).max(999_999_999_999.99).refine((value) => Number(value.toFixed(2)) === value),
  freeShippingThreshold: z.number().finite().positive().max(999_999_999_999.99).nullable(),
}).refine((value) => value.homeDeliveryEnabled || value.branchDeliveryEnabled, {
  message: "Activá al menos un tipo de entrega.", path: ["homeDeliveryEnabled"],
}).refine((value) => value.itemWeightGrams + value.packageWeightGrams <= 25_000 &&
  value.itemHeightCm + value.packageHeightCm <= 150);

export type ShippingSettingsInput = z.infer<typeof shippingSettingsSchema>;
export type AdminShippingSettings = ShippingSettingsInput & {
  appConfigured: boolean;
  configured: boolean;
  storageReady: boolean;
};
