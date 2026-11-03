import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const SESSION_SECONDS = 60 * 60 * 24 * 7;
export const COOKIE_NAME = "eterea_session";

type SessionPayload = { userId: string; expiresAt: number; credentialVersion: string };

export function credentialVersion(passwordHash: string) {
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

export function createSessionToken(userId: string, passwordHash: string) {
  const payload: SessionPayload = {
    userId,
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_SECONDS,
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
