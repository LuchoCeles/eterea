import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword, isOwnerRequest } from "@/server/auth";
import { prisma } from "@/server/prisma";

const noStore = { "Cache-Control": "no-store" };
const createUserSchema = z.object({
  name: z.string().trim().min(1).max(100),
  username: z.string().trim().min(3).max(191).regex(/^[a-z0-9._@+-]+$/i),
  password: z.string().min(12).max(128),
});

export async function GET(request: Request) {
  if (!(await isOwnerRequest(request))) {
    return NextResponse.json({ error: "Solo el dueño puede administrar usuarios." }, { status: 403, headers: noStore });
  }
  const users = await prisma.user.findMany({
    select: { id: true, name: true, username: true, createdAt: true, roles: { select: { role: true } } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  return NextResponse.json({ users: users.map((user) => ({
    id: user.id,
    name: user.name || user.username,
    username: user.username,
    createdAt: user.createdAt,
    role: user.roles.some(({ role }) => role === "owner") ? "owner" : "admin",
  })) }, { headers: noStore });
}

export async function POST(request: Request) {
  if (!(await isOwnerRequest(request))) {
    return NextResponse.json({ error: "Solo el dueño puede administrar usuarios." }, { status: 403, headers: noStore });
  }
  const parsed = createUserSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ingresá un nombre, un usuario válido y una contraseña de al menos 12 caracteres." }, { status: 400, headers: noStore });
  }
  const username = parsed.data.username.toLowerCase();
  try {
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        username,
        passwordHash: await hashPassword(parsed.data.password),
        roles: { create: { role: "admin" } },
      },
      select: { id: true, name: true, username: true, createdAt: true },
    });
    return NextResponse.json({ user: { ...user, role: "admin" } }, { status: 201, headers: noStore });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Ese usuario ya existe." }, { status: 409, headers: noStore });
    }
    return NextResponse.json({ error: "No se pudo crear el usuario." }, { status: 500, headers: noStore });
  }
}
