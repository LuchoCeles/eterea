"use server";

import { z } from "zod";
import { isCurrentUserAdmin } from "@/server/auth";
import { disconnectInstagramConnection, instagramConnectionStatus, InstagramConnectionError, saveInstagramConnection, validateInstagramConnection } from "@/server/instagram";
import { invalidateStorefrontContent } from "@/server/storefront-content";

const connectionSchema = z.object({
  token: z.string().trim().min(20).max(4000),
  accountId: z.string().trim().regex(/^\d{1,32}$/),
});
const confirmationSchema = connectionSchema.extend({ confirmUsername: z.string().trim().min(1).max(30) });

export async function instagramStatusAction() {
  if (!(await isCurrentUserAdmin())) return { error: "No autorizado." };
  try {
    return { data: await instagramConnectionStatus() };
  } catch {
    return { error: "No se pudo consultar la conexión de Instagram." };
  }
}

export async function validateInstagramAction(input: { token: string; accountId: string }) {
  if (!(await isCurrentUserAdmin())) return { error: "No autorizado." };
  const parsed = connectionSchema.safeParse(input);
  if (!parsed.success) return { error: "Ingresá un token de Meta y un ID de cuenta de Instagram válidos." };
  try {
    const profile = await validateInstagramConnection(parsed.data.token, parsed.data.accountId);
    return { data: { username: profile.username, accountId: profile.id, sampleCount: profile.sampleCount } };
  } catch (error) {
    return { error: error instanceof InstagramConnectionError ? error.message : "No se pudo validar la conexión con Instagram." };
  }
}

export async function saveInstagramAction(input: { token: string; accountId: string; confirmUsername: string }) {
  if (!(await isCurrentUserAdmin())) return { error: "No autorizado." };
  const parsed = confirmationSchema.safeParse(input);
  if (!parsed.success) return { error: "Validá la cuenta antes de confirmar la conexión." };
  try {
    const profile = await saveInstagramConnection(parsed.data.token, parsed.data.accountId, parsed.data.confirmUsername);
    invalidateStorefrontContent();
    return { data: { username: profile.username, accountId: profile.id } };
  } catch (error) {
    return { error: error instanceof InstagramConnectionError ? error.message : "No se pudo guardar la conexión de Instagram." };
  }
}

export async function disconnectInstagramAction() {
  if (!(await isCurrentUserAdmin())) return { error: "No autorizado." };
  try {
    await disconnectInstagramConnection();
    invalidateStorefrontContent();
    return { data: { saved: false } };
  } catch {
    return { error: "No se pudo desvincular la cuenta de Instagram." };
  }
}
