import { NextResponse } from "next/server";
import { z } from "zod";
import { createSessionToken, isAdmin, sessionCookie, verifyPassword } from "@/server/auth";
import { prisma } from "@/server/prisma";

const credentials = z.object({ username: z.string().trim().min(1).max(191), password: z.string().min(1).max(128) });

export async function POST(request: Request) {
  const parsed = credentials.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
  const username = parsed.data.username.toLowerCase();
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash)) || !(await isAdmin(user.id))) {
    return NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.headers.append("Set-Cookie", sessionCookie(createSessionToken(user.id, user.passwordHash)));
  return response;
}
