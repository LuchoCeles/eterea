"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { COOKIE_NAME, createSessionToken, verifyPassword } from "@/server/auth";
import { prisma } from "@/server/prisma";

const credentials = z.object({ username: z.string().trim().min(1).max(191), password: z.string().min(1).max(128) });

export async function loginAction(input: { username: string; password: string }) {
  const parsed = credentials.safeParse(input);
  if (!parsed.success) return { error: "Usuario o contraseña incorrectos." };
  const user = await prisma.user.findUnique({
    where: { username: parsed.data.username.toLowerCase() },
    select: { id: true, passwordHash: true, roles: { where: { role: "admin" }, select: { id: true } } },
  });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash)) || !user.roles.length) {
    return { error: "Usuario o contraseña incorrectos." };
  }
  (await cookies()).set(COOKIE_NAME, createSessionToken(user.id, user.passwordHash), {
    path: "/", httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 7,
  });
  return { ok: true };
}

export async function logoutAction() {
  (await cookies()).delete(COOKIE_NAME);
  return { ok: true };
}
