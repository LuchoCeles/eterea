import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export type EncryptedShippingPassword = { encryptedPassword: string; passwordIv: string; passwordTag: string };

function key(secret: string) {
  if (Buffer.byteLength(secret) < 32) throw new Error("Configurá AUTH_SECRET para guardar la contraseña de Correo Argentino.");
  return createHash("sha256").update("eterea-shipping-encryption:").update(secret).digest();
}

export function encryptShippingPassword(password: string, secret: string): EncryptedShippingPassword {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(secret), iv);
  const encrypted = Buffer.concat([cipher.update(password, "utf8"), cipher.final()]);
  return { encryptedPassword: encrypted.toString("base64"), passwordIv: iv.toString("base64"),
    passwordTag: cipher.getAuthTag().toString("base64") };
}

export function decryptShippingPassword(data: EncryptedShippingPassword, secret: string): string | null {
  try {
    const decipher = createDecipheriv("aes-256-gcm", key(secret), Buffer.from(data.passwordIv, "base64"));
    decipher.setAuthTag(Buffer.from(data.passwordTag, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(data.encryptedPassword, "base64")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
