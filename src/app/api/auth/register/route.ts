import { NextResponse } from "next/server";
import { z } from "zod";
import { createSessionToken, hashPassword, sessionCookie } from "@/server/auth";
import { prisma } from "@/server/prisma";

const credentials = z.object({ email: z.string().email().max(191), password: z.string().min(8).max(128) });

export async function POST(request: Request) {
  const parsed = credentials.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ingresá un email válido y una contraseña de al menos 8 caracteres." }, { status: 400 });

  const email = parsed.data.email.trim().toLowerCase();
  try {
    const user = await prisma.$transaction(async (transaction) => {
      const created = await transaction.user.create({ data: { email, passwordHash: await hashPassword(parsed.data.password) } });
      const totalUsers = await transaction.user.count();
      if (totalUsers === 1) await transaction.userRole.create({ data: { userId: created.id, role: "admin" } });
      return created;
    });
    const response = NextResponse.json({ ok: true });
    response.headers.append("Set-Cookie", sessionCookie(createSessionToken(user.id)));
    return response;
  } catch {
    return NextResponse.json({ error: "No se pudo crear la cuenta. Si ya existe, ingresá con tu contraseña." }, { status: 409 });
  }
}