import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword, isOwnerRequest } from "@/server/auth";
import { prisma } from "@/server/prisma";

const noStore = { "Cache-Control": "no-store" };
const editUserSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  username: z.string().trim().min(3).max(191).regex(/^[a-z0-9._@+-]+$/i).optional(),
  password: z.string().min(12).max(128).optional(),
}).refine(({ name, username, password }) => name !== undefined || username !== undefined || password !== undefined);
type Context = { params: Promise<{ id: string }> };

async function editableUser(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, roles: { select: { role: true } } },
  });
}

export async function PATCH(request: Request, context: Context) {
  if (!(await isOwnerRequest(request))) {
    return NextResponse.json({ error: "Solo el dueño puede administrar usuarios." }, { status: 403, headers: noStore });
  }
  const { id } = await context.params;
  const target = await editableUser(id);
  if (!target) return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404, headers: noStore });
  const parsed = editUserSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ingresá un nombre, un usuario válido o una contraseña de al menos 12 caracteres." }, { status: 400, headers: noStore });
  }
  if (target.roles.some(({ role }) => role === "owner") && (parsed.data.username !== undefined || parsed.data.password !== undefined)) {
    return NextResponse.json({ error: "El nombre del dueño se puede editar, pero sus credenciales están protegidas." }, { status: 403, headers: noStore });
  }
  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined && { name: parsed.data.name }),
        ...(parsed.data.username !== undefined && { username: parsed.data.username.toLowerCase() }),
        ...(parsed.data.password !== undefined && { passwordHash: await hashPassword(parsed.data.password) }),
      },
      select: { id: true, name: true, username: true },
    });
    return NextResponse.json({ user }, { headers: noStore });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Ese usuario ya existe." }, { status: 409, headers: noStore });
    }
    return NextResponse.json({ error: "No se pudo actualizar el usuario." }, { status: 500, headers: noStore });
  }
}

export async function DELETE(request: Request, context: Context) {
  if (!(await isOwnerRequest(request))) {
    return NextResponse.json({ error: "Solo el dueño puede administrar usuarios." }, { status: 403, headers: noStore });
  }
  const { id } = await context.params;
  const target = await editableUser(id);
  if (!target) return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404, headers: noStore });
  if (target.roles.some(({ role }) => role === "owner")) {
    return NextResponse.json({ error: "La cuenta del dueño no se puede eliminar." }, { status: 403, headers: noStore });
  }
  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true }, { headers: noStore });
  } catch {
    return NextResponse.json({ error: "No se pudo eliminar el usuario." }, { status: 500, headers: noStore });
  }
}
