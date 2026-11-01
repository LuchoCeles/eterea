import { z } from "zod";

export const shippingSettingsSchema = z.object({
  environment: z.enum(["production", "test"]),
  apiUser: z.string().trim().min(1).max(191),
  password: z.string().max(200),
  customerId: z.string().trim().regex(/^\d{1,32}$/),
  postalCodeOrigin: z.string().regex(/^\d{4}$/),
  itemWeightGrams: z.number().int().min(1).max(25_000),
  packageWeightGrams: z.number().int().min(1).max(25_000),
  itemHeightCm: z.number().int().min(1).max(150),
  packageHeightCm: z.number().int().min(1).max(150),
  packageWidthCm: z.number().int().min(1).max(150),
  packageLengthCm: z.number().int().min(1).max(150),
  freeShippingThreshold: z.number().finite().positive().max(999_999_999_999.99).nullable(),
}).refine((value) => value.itemWeightGrams + value.packageWeightGrams <= 25_000 &&
  value.itemHeightCm + value.packageHeightCm <= 150);

export type ShippingSettingsInput = z.infer<typeof shippingSettingsSchema>;
export type AdminShippingSettings = Omit<ShippingSettingsInput, "password"> & {
  passwordConfigured: boolean;
  configured: boolean;
  storageReady: boolean;
};
