"use server";

import { createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { z } from "zod";
import { COOKIE_NAME, createSessionToken, verifyPassword } from "@/server/auth";
import { prisma } from "@/server/prisma";
import { clearRateLimit, consumeRateLimit } from "@/server/rate-limit";

const credentials = z.object({ username: z.string().trim().min(1).max(191), password: z.string().min(1).max(128) });
const invalidCredentials = "Usuario o contraseña incorrectos.";
const blockedLogin = "Hubo demasiados intentos. Volvé a probar en unos minutos.";
const unavailableLogin = "No se pudo iniciar sesión. Probá de nuevo más tarde.";
const dummyPasswordHash = "scrypt$login-no-user$LojonsllAjSjFQPSb_dh-gIvICERkFGiY2NAgvJ4EZeLGyxZL4TRfj7aqcZvHo5kIsO6nS4dUtfZMjinG_3NlQ";

function usernameBucket(username: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) throw new Error("Configurá AUTH_SECRET para limitar los intentos de acceso.");
  // Un espacio fijo evita crear filas sin límite mediante nombres de usuario aleatorios.
  return `login:usuario:${createHmac("sha256", secret).update(username).digest("hex").slice(0, 4)}`;
}

export async function loginAction(input: { username: string; password: string }) {
  const parsed = credentials.safeParse(input);
  if (!parsed.success) return { error: invalidCredentials };
  const username = parsed.data.username.toLowerCase();
  let bucketKey: string;
  try {
    bucketKey = usernameBucket(username);
    const globalLimit = await consumeRateLimit("login:global", 1200, 15 * 60);
    if (!globalLimit.allowed) return { error: blockedLogin };
    const userLimit = await consumeRateLimit(bucketKey, 8, 15 * 60);
    if (!userLimit.allowed) return { error: blockedLogin };
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, passwordHash: true, roles: { where: { role: "admin" }, select: { id: true } } },
    });
    const validPassword = await verifyPassword(parsed.data.password, user?.passwordHash ?? dummyPasswordHash);
    if (!user || !validPassword || !user.roles.length) return { error: invalidCredentials };
    await clearRateLimit(bucketKey);
    (await cookies()).set(COOKIE_NAME, createSessionToken(user.id, user.passwordHash), {
      path: "/", httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 7,
    });
    return { ok: true };
  } catch (error) {
    console.error("No se pudo limitar o completar el inicio de sesión.", error);
    return { error: unavailableLogin };
  }
}

export async function logoutAction() {
  (await cookies()).delete(COOKIE_NAME);
  return { ok: true };
}
