import "server-only";
import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { prisma } from "@/server/prisma";

const scrypt = promisify(scryptCallback);
const COOKIE_NAME = "eterea_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = { userId: string; expiresAt: number };

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

export function createSessionToken(userId: string) {
  const payload: SessionPayload = { userId, expiresAt: Math.floor(Date.now() / 1000) + SESSION_SECONDS };
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
    if (!payload.userId || payload.expiresAt <= Math.floor(Date.now() / 1000)) return null;
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
  return prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, email: true } });
}

export async function isAdmin(userId: string) {
  const role = await prisma.userRole.findFirst({ where: { userId, role: "admin" }, select: { id: true } });
  return role !== null;
}

export async function isCurrentUserAdmin() {
  const user = await getCurrentUser();
  return user ? isAdmin(user.id) : false;
}

export async function isAdminRequest(request: Request) {
  const cookie = request.headers.get("cookie")?.match(/(?:^|; *)eterea_session=([^;]+)/)?.[1];
  const session = readSessionToken(cookie);
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true } });
  if (!user || !(await isAdmin(user.id))) return null;
  return user;
}

export { COOKIE_NAME };
