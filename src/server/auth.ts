import "server-only";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/server/prisma";
import { COOKIE_NAME, credentialVersion, readSessionToken } from "@/server/session-token";

const scrypt = promisify(scryptCallback);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [algorithm, salt, expectedText] = stored.split("$");
  if (algorithm !== "scrypt" || !salt || !expectedText) return false;
  const expected = Buffer.from(expectedText, "base64url");
  const actual = (await scrypt(password, salt, expected.length)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export const getCurrentUser = cache(async () => {
  const cookieStore = await cookies();
  const session = readSessionToken(cookieStore.get(COOKIE_NAME)?.value);
  if (!session) return null;
  const rows = await prisma.$queryRaw<{ id: string; name: string; username: string; passwordHash: string; role: string | null }[]>`
    SELECT u.id, u.name, u.username, u.passwordHash, r.role
    FROM User u
    LEFT JOIN UserRole r ON r.userId = u.id AND r.role IN ('admin', 'owner')
    WHERE u.id = ${session.userId}
  `;
  const user = rows[0];
  const roles = new Set(rows.map(({ role }) => role));
  return user && session.credentialVersion === credentialVersion(user.passwordHash)
    ? {
      id: user.id, name: user.name, username: user.username,
      isAdmin: roles.has("admin"),
      isOwner: roles.has("admin") && roles.has("owner"),
    }
    : null;
});

export async function isCurrentUserAdmin() {
  const user = await getCurrentUser();
  return user?.isAdmin ?? false;
}

export async function isAdminRequest(request: Request) {
  const cookie = request.headers.get("cookie")?.match(/(?:^|; *)eterea_session=([^;]+)/)?.[1];
  const session = readSessionToken(cookie);
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, passwordHash: true, roles: { where: { role: "admin" }, select: { id: true } } },
  });
  return user && session.credentialVersion === credentialVersion(user.passwordHash) && user.roles.length
    ? { id: user.id } : null;
}

export { COOKIE_NAME, createSessionToken, readSessionToken } from "@/server/session-token";
