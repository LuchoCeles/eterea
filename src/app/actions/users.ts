"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { COOKIE_NAME, createSessionToken, getCurrentUser, hashPassword, verifyPassword } from "@/server/auth";
import { prisma } from "@/server/prisma";

const createUserSchema = z.object({
  name: z.string().trim().min(1).max(100),
  username: z.string().trim().min(3).max(191).regex(/^[a-z0-9._@+-]+$/i),
  password: z.string().min(12).max(128),
});
const editUserSchema = createUserSchema.pick({ name: true, username: true }).partial().strict()
  .refine(({ name, username }) => name !== undefined || username !== undefined);
const changePasswordSchema = z.object({
  password: z.string().min(12).max(128),
  currentPassword: z.string().min(1).max(128).optional(),
}).strict();

async function ownerAuthorized() {
  const user = await getCurrentUser();
  return user?.isOwner ?? false;
}

async function editableUser(id: string) {
  return prisma.user.findUnique({ where: { id }, select: { id: true, roles: { select: { role: true } } } });
}

function validUserId(id: unknown): id is string {
  return typeof id === "string" && id.length > 0 && id.length <= 191;
}

export async function createUserAction(input: { name: string; username: string; password: string }) {
  if (!(await ownerAuthorized())) return { error: "Solo el dueño puede administrar usuarios." };
  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) return { error: "Ingresá un nombre, un usuario válido y una contraseña de al menos 12 caracteres." };
  try {
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name, username: parsed.data.username.toLowerCase(),
        passwordHash: await hashPassword(parsed.data.password), roles: { create: { role: "admin" } },
      },
      select: { id: true, name: true, username: true, createdAt: true },
    });
    revalidatePath("/admin/usuarios");
    return { user: { ...user, name: user.name || user.username, createdAt: user.createdAt.toISOString(), role: "admin" } };
  } catch (error) {
    return { error: isUniqueError(error) ? "Ese usuario ya existe." : "No se pudo crear el usuario." };
  }
}

export async function updateUserAction(id: string, input: { name?: string; username?: string }) {
  if (!(await ownerAuthorized())) return { error: "Solo el dueño puede administrar usuarios." };
  if (!validUserId(id)) return { error: "Usuario no encontrado." };
  const target = await editableUser(id);
  if (!target) return { error: "Usuario no encontrado." };
  const parsed = editUserSchema.safeParse(input);
  if (!parsed.success) return { error: "Ingresá un nombre o un usuario válido." };
  if (target.roles.some(({ role }) => role === "owner") && parsed.data.username !== undefined) {
    return { error: "El usuario de acceso del dueño está protegido." };
  }
  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined && { name: parsed.data.name }),
        ...(parsed.data.username !== undefined && { username: parsed.data.username.toLowerCase() }),
      },
      select: { id: true, name: true, username: true },
    });
    revalidatePath("/admin/usuarios");
    return { user: { ...user, name: user.name || user.username } };
  } catch (error) {
    return { error: isUniqueError(error) ? "Ese usuario ya existe." : "No se pudo actualizar el usuario." };
  }
}

export async function deleteUserAction(id: string) {
  if (!(await ownerAuthorized())) return { error: "Solo el dueño puede administrar usuarios." };
  if (!validUserId(id)) return { error: "Usuario no encontrado." };
  const target = await editableUser(id);
  if (!target) return { error: "Usuario no encontrado." };
  if (target.roles.some(({ role }) => role === "owner")) return { error: "La cuenta del dueño no se puede eliminar." };
  try {
    await prisma.user.delete({ where: { id } });
    revalidatePath("/admin/usuarios");
    return { ok: true };
  } catch {
    return { error: "No se pudo eliminar el usuario." };
  }
}

export async function changePasswordAction(id: string, input: { password: string; currentPassword?: string }) {
  const actor = await getCurrentUser();
  if (!actor?.isAdmin) return { error: "No autorizado." };
  if (!validUserId(id)) return { error: "Usuario no encontrado." };
  const ownPassword = actor.id === id;
  if (!ownPassword && !actor.isOwner) return { error: "Solo podés cambiar tu propia contraseña." };
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return { error: "Ingresá una contraseña nueva de entre 12 y 128 caracteres." };
  if (ownPassword && !parsed.data.currentPassword) return { error: "Ingresá tu contraseña actual." };
  const target = await prisma.user.findUnique({ where: { id }, select: { passwordHash: true } });
  if (!target) return { error: "Usuario no encontrado." };
  if (ownPassword && !(await verifyPassword(parsed.data.currentPassword!, target.passwordHash))) {
    return { error: "La contraseña actual es incorrecta." };
  }
  try {
    const passwordHash = await hashPassword(parsed.data.password);
    const updated = await prisma.user.updateMany({ where: { id, passwordHash: target.passwordHash }, data: { passwordHash } });
    if (updated.count !== 1) return { error: "La contraseña cambió durante la operación. Intentá de nuevo." };
    if (ownPassword) (await cookies()).set(COOKIE_NAME, createSessionToken(id, passwordHash), {
      path: "/", httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 7,
    });
    return { ok: true };
  } catch {
    return { error: "No se pudo cambiar la contraseña." };
  }
}

function isUniqueError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}
