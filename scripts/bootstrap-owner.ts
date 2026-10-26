import "dotenv/config";
import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import { PrismaClient } from "@/generated/prisma/client";
import { createMariaDbAdapter } from "@/server/prisma-adapter";

const scrypt = promisify(scryptCallback);
const username = process.env.BOOTSTRAP_OWNER_USERNAME?.trim().toLowerCase();
const name = process.env.BOOTSTRAP_OWNER_NAME?.trim() || username?.slice(0, 100);
const password = process.env.BOOTSTRAP_OWNER_PASSWORD;

if (!username || !/^[a-z0-9._@+-]{3,191}$/.test(username) || !name || name.length > 100 || !password || password.length < 12 || password.length > 128) {
  throw new Error("Configurá BOOTSTRAP_OWNER_USERNAME, un nombre de hasta 100 caracteres y BOOTSTRAP_OWNER_PASSWORD (12 a 128 caracteres) para crear la primera cuenta.");
}

const prisma = new PrismaClient({ adapter: createMariaDbAdapter() });

try {
  const salt = randomBytes(16).toString("base64url");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const passwordHash = `scrypt$${salt}$${derived.toString("base64url")}`;
  await prisma.$transaction(async (transaction) => {
    if (await transaction.user.count()) {
      throw new Error("Ya existen cuentas. Esta operación solo crea la primera cuenta en una base vacía.");
    }
    await transaction.user.create({
      data: { name, username, passwordHash, roles: { create: [{ role: "admin" }, { role: "owner" }] } },
    });
  });
  console.log(`Se creó la cuenta dueña ${name} (${username}).`);
} finally {
  await prisma.$disconnect();
}
