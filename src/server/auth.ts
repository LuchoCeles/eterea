import "server-only";
import { createHash, createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { prisma } from "@/server/prisma";

const scrypt = promisify(scryptCallback);
const COOKIE_NAME = "eterea_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = { userId: string; expiresAt: number; credentialVersion: string };

function credentialVersion(passwordHash: string) {
  return createHash("sha256").update(passwordHash).digest("base64url");
}

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || Buffer.byteLength(value) < 32) {
    throw new Error("Configurá AUTH_SECRET con al menos 32 bytes antes de habilitar sesiones.");
  }
  return value;
}

function signature(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

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

export function createSessionToken(userId: string, passwordHash: string) {
  const payload: SessionPayload = {
    userId, expiresAt: Math.floor(Date.now() / 1000) + SESSION_SECONDS,
    credentialVersion: credentialVersion(passwordHash),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${signature(encoded)}`;
}

export function readSessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [encoded, received] = token.split(".");
  if (!encoded || !received) return null;
  try {
    const expected = Buffer.from(signature(encoded));
    const actual = Buffer.from(received);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.userId || !payload.credentialVersion || payload.expiresAt <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function sessionCookie(token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}${secure}`;
}

export function expiredSessionCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const session = readSessionToken(cookieStore.get(COOKIE_NAME)?.value);
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId }, select: { id: true, name: true, username: true, passwordHash: true },
  });
  return user && session.credentialVersion === credentialVersion(user.passwordHash)
    ? { id: user.id, name: user.name, username: user.username }
    : null;
}

export async function isAdmin(userId: string) {
  const role = await prisma.userRole.findFirst({ where: { userId, role: "admin" }, select: { id: true } });
  return role !== null;
}

export async function isOwner(userId: string) {
  const roles = await prisma.userRole.findMany({
    where: { userId, role: { in: ["admin", "owner"] } }, select: { role: true },
  });
  return roles.some(({ role }) => role === "admin") && roles.some(({ role }) => role === "owner");
}

export async function isCurrentUserAdmin() {
  const user = await getCurrentUser();
  return user ? isAdmin(user.id) : false;
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

export async function isOwnerRequest(request: Request) {
  const cookie = request.headers.get("cookie")?.match(/(?:^|; *)eterea_session=([^;]+)/)?.[1];
  const session = readSessionToken(cookie);
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, passwordHash: true, roles: { where: { role: { in: ["admin", "owner"] } }, select: { role: true } } },
  });
  return user && session.credentialVersion === credentialVersion(user.passwordHash)
    && user.roles.some(({ role }) => role === "admin") && user.roles.some(({ role }) => role === "owner")
    ? { id: user.id } : null;
}

export { COOKIE_NAME };
