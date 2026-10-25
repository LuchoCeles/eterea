import { readFile } from "node:fs/promises";
import "dotenv/config";
import { PrismaClient } from "@/generated/prisma/client";
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

const markerRows = await prisma.$queryRaw<{ data: unknown }[]>`SELECT data FROM SiteContent WHERE \`key\` = '__catalog_relational_v1'`;
const catalogMigrated = markerRows[0];
if (catalogMigrated && (typeof catalogMigrated.data === "string" ? JSON.parse(catalogMigrated.data) : catalogMigrated.data) === true
  && rows.some((row) => row.key === "products" || row.key === "categories" || row.key === "texts")) {
  throw new Error("El catálogo ya usa tablas propias. Importá el contenido heredado antes de ejecutar db:migrate-catalog.");
}

let imported = 0;
for (const row of rows) {
  if (!contentKeys.includes(row.key as ContentKey)) continue;
  const key = row.key as ContentKey;
  const parsed = contentSchemas[key].safeParse(row.data);
  if (!parsed.success) {
    console.warn(`Se omitió la sección «${key}»: el JSON no coincide con el formato actual.`);
    continue;
  }
  const merged = resolveContent(key, parsed.data);
  await prisma.$executeRaw`INSERT INTO SiteContent (\`key\`, data, updatedAt)
    VALUES (${key}, ${JSON.stringify(merged)}, NOW(3))
    ON DUPLICATE KEY UPDATE data = VALUES(data), updatedAt = NOW(3)`;
  imported += 1;
}

console.info(`Se importaron ${imported} secciones de contenido.`);
await prisma.$disconnect();
