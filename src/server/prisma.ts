import "server-only";
import { PrismaClient } from "@/generated/prisma/client";
import { createMariaDbAdapter } from "@/server/prisma-adapter";

const prismaGlobal = globalThis as typeof globalThis & { etereaPrisma?: PrismaClient };

export const prisma =
  prismaGlobal.etereaPrisma ??
  new PrismaClient({
    adapter: createMariaDbAdapter(),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") prismaGlobal.etereaPrisma = prisma;