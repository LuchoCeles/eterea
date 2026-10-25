import { readFile } from "node:fs/promises";
import "dotenv/config";
import { Prisma, PrismaClient } from "@/generated/prisma/client";
import { createMariaDbAdapter } from "@/server/prisma-adapter";
import { defaults } from "@/lib/content";
import { contentSchemas } from "@/lib/content-schema";
import { resolveContent, type ContentKey } from "@/lib/content";
const prisma = new PrismaClient({ adapter: createMariaDbAdapter() });
const contentKeys = Object.keys(defaults) as ContentKey[];

type ExportedRow = { key: string; data: unknown };

const filePath = process.argv[2];
if (!filePath) throw new Error("Indicá la ruta al JSON exportado, por ejemplo: npm run db:import-content -- ./legacy-site-content.json");

const raw = JSON.parse(await readFile(filePath, "utf8")) as unknown;
const rows: ExportedRow[] = Array.isArray(raw)
  ? raw as ExportedRow[]
  : Object.entries(raw as Record<string, unknown>).map(([key, data]) => ({ key, data }));

let imported = 0;
for (const row of rows) {
  if (!contentKeys.includes(row.key as ContentKey)) continue;
  const key = row.key as ContentKey;
  const parsed = contentSchemas[key].safeParse(row.data);
  if (!parsed.success) {
    console.warn(`Se omitió la sección «${key}»: el JSON no coincide con el formato actual.`);
    continue;
  }
  const merged = resolveContent(key, parsed.data) as Prisma.InputJsonValue;
  await prisma.siteContent.upsert({ where: { key }, create: { key, data: merged }, update: { data: merged } });
  imported += 1;
}

console.info(`Se importaron ${imported} secciones de contenido.`);
await prisma.$disconnect();