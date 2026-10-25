import { NextResponse } from "next/server";
import { z } from "zod";
import { createSessionToken, sessionCookie, verifyPassword } from "@/server/auth";
import { prisma } from "@/server/prisma";

const credentials = z.object({ email: z.string().email().max(191), password: z.string().min(1).max(128) });

export async function POST(request: Request) {
  const parsed = credentials.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Email o contraseña incorrectos." }, { status: 401 });
  const email = parsed.data.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return NextResponse.json({ error: "Email o contraseña incorrectos." }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.headers.append("Set-Cookie", sessionCookie(createSessionToken(user.id)));
  return response;
}