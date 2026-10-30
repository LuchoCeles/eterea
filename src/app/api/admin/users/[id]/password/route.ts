import { NextResponse } from "next/server";
import { z } from "zod";
import { createSessionToken, hashPassword, isAdminRequest, isOwnerRequest, sessionCookie, verifyPassword } from "@/server/auth";
import { prisma } from "@/server/prisma";

const noStore = { "Cache-Control": "no-store" };
const changePasswordSchema = z.object({
  password: z.string().min(12).max(128),
  currentPassword: z.string().min(1).max(128).optional(),
}).strict();
type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const actor = await isAdminRequest(request);
  if (!actor) return NextResponse.json({ error: "No autorizado." }, { status: 401, headers: noStore });

  const { id } = await context.params;
  const ownPassword = actor.id === id;
  if (!ownPassword && !(await isOwnerRequest(request))) {
    return NextResponse.json({ error: "Solo podés cambiar tu propia contraseña." }, { status: 403, headers: noStore });
  }

  const parsed = changePasswordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ingresá una contraseña nueva de entre 12 y 128 caracteres." }, { status: 400, headers: noStore });
  }
  if (ownPassword && !parsed.data.currentPassword) {
    return NextResponse.json({ error: "Ingresá tu contraseña actual." }, { status: 400, headers: noStore });
  }

  const target = await prisma.user.findUnique({ where: { id }, select: { passwordHash: true } });
  if (!target) return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404, headers: noStore });
  if (ownPassword && !(await verifyPassword(parsed.data.currentPassword!, target.passwordHash))) {
    return NextResponse.json({ error: "La contraseña actual es incorrecta." }, { status: 400, headers: noStore });
  }

  try {
    const passwordHash = await hashPassword(parsed.data.password);
    const updated = await prisma.user.updateMany({
      where: { id, passwordHash: target.passwordHash },
      data: { passwordHash },
    });
    if (updated.count !== 1) {
      return NextResponse.json({ error: "La contraseña cambió durante la operación. Intentá de nuevo." }, { status: 409, headers: noStore });
    }
    const response = NextResponse.json({ ok: true }, { headers: noStore });
    if (ownPassword) response.headers.append("Set-Cookie", sessionCookie(createSessionToken(id, passwordHash)));
    return response;
  } catch {
    return NextResponse.json({ error: "No se pudo cambiar la contraseña." }, { status: 500, headers: noStore });
  }
}
