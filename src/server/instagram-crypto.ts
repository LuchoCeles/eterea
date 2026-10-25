import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export type StoredInstagramToken = {
  version: 2;
  connectionId: string;
  token: string;
  iv: string;
  tag: string;
  nextRefreshAt: number;
  accountId?: string;
  username?: string;
};

function encryptionKey(secret: string) {
  if (Buffer.byteLength(secret) < 32) throw new Error("Configurá AUTH_SECRET para guardar el token de Instagram.");
  return createHash("sha256").update("eterea-instagram-encryption:").update(secret).digest();
}

export function encryptInstagramToken(token: string, connectionId: string, nextRefreshAt: number, secret: string, profile?: { accountId?: string; username?: string }): StoredInstagramToken {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(secret), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return {
    version: 2,
    connectionId,
    token: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    nextRefreshAt,
    ...profile,
  };
}

export function decryptInstagramToken(value: StoredInstagramToken, secret: string): string | null {
  try {
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(secret), Buffer.from(value.iv, "base64"));
    decipher.setAuthTag(Buffer.from(value.tag, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(value.token, "base64")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
