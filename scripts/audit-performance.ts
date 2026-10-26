import "dotenv/config";
import { performance } from "node:perf_hooks";
import { PrismaClient, type Prisma } from "@/generated/prisma/client";
import { groupProductRelations, type ProductRelationRow } from "@/lib/product-relations";
import { createMariaDbAdapter } from "@/server/prisma-adapter";
import { loadRelationalContentWithSections } from "@/server/relational-content";

const poolArg = process.argv.find((arg) => arg.startsWith("--pool="));
const poolLimit = poolArg ? Number(poolArg.slice("--pool=".length)) : 5;
if (!Number.isInteger(poolLimit) || poolLimit < 1 || poolLimit > 10) {
  throw new Error("El tamaño del pool debe estar entre 1 y 10.");
}
const db = new PrismaClient({ adapter: createMariaDbAdapter(poolLimit), log: [{ level: "query", emit: "event" }] });
const queryDurations: number[] = [];
db.$on("query", (event) => queryDurations.push(event.duration));

async function timed<T>(label: string, query: () => Promise<T>) {
  const started = performance.now();
  const result = await query();
  console.log(`${label}: ${(performance.now() - started).toFixed(1)} ms`);
  return result;
}

function readLegacySnapshot() {
  return Promise.all([
    loadRelationalContentWithSections(db),
    db.category.findMany({ orderBy: [{ position: "asc" }, { id: "asc" }], select: { id: true, name: true, hidden: true } }),
    db.product.findMany({ include: {
      paymentPrices: { where: { active: true }, orderBy: [{ position: "asc" }, { id: "asc" }], select: { label: true, price: true } },
      images: { orderBy: { position: "asc" }, select: { url: true } },
      sizes: { orderBy: { position: "asc" }, select: { label: true } },
      colors: { orderBy: { position: "asc" }, select: { label: true } },
    }, orderBy: [{ position: "asc" }, { id: "asc" }] }),
    db.homeCategoryCard.findMany({ orderBy: [{ position: "asc" }, { id: "asc" }],
      select: { id: true, categoryId: true, img: true, hidden: true, productId: true, position: true } }),
  ]);
}

type SnapshotDb = Parameters<typeof loadRelationalContentWithSections>[0]
  & Pick<Prisma.TransactionClient, "category" | "product" | "homeCategoryCard" | "$queryRaw">;

async function readMeasuredSnapshot(client: SnapshotDb = db) {
  const result = await Promise.all([
    loadRelationalContentWithSections(client),
    client.category.findMany({ orderBy: [{ position: "asc" }, { id: "asc" }], select: { id: true, name: true, hidden: true } }),
    client.product.findMany({ orderBy: [{ position: "asc" }, { id: "asc" }] }),
    client.homeCategoryCard.findMany({ orderBy: [{ position: "asc" }, { id: "asc" }],
      select: { id: true, categoryId: true, img: true, hidden: true, productId: true, position: true } }),
    client.$queryRaw<ProductRelationRow[]>`
      SELECT productId, position, 'image' AS kind, url AS value, NULL AS price, '' AS rowId FROM ProductImage
      UNION ALL SELECT productId, position, 'size', label, NULL, '' FROM ProductSize
      UNION ALL SELECT productId, position, 'color', label, NULL, '' FROM ProductColor
      UNION ALL SELECT productId, position, 'payment', label, price, id FROM ProductPaymentPrice WHERE active = true
    `,
  ]);
  groupProductRelations(result[4]);
  return result;
}

async function main() {
  if (process.argv.includes("--snapshot-only")) {
    const repeatArg = process.argv.find((arg) => arg.startsWith("--repeat="));
    const repeats = repeatArg ? Number(repeatArg.slice("--repeat=".length)) : 3;
    if (!Number.isInteger(repeats) || repeats < 1 || repeats > 10) throw new Error("Las repeticiones deben estar entre 1 y 10.");
    const useLegacy = process.argv.includes("--legacy-relations");
    for (let index = 0; index < repeats; index += 1) {
      const before = queryDurations.length;
      if (useLegacy) await timed(`Snapshot anterior ${index + 1} (pool ${poolLimit})`, readLegacySnapshot);
      else await timed(`Snapshot ${index + 1} (pool ${poolLimit})`, () =>
        process.argv.includes("--transaction") ? db.$transaction((tx) => readMeasuredSnapshot(tx)) : readMeasuredSnapshot());
      console.log("Consultas:", queryDurations.length - before);
    }
    return;
  }
  const counts = await timed("Conteos de tablas", () => Promise.all([
    db.product.count(), db.category.count(), db.productImage.count(),
    db.productPaymentPrice.count(), db.homeCategoryCard.count(),
    db.instagramMediaEntry.count(), db.cloudinaryCleanup.count(), db.media.count(),
    db.instagramConnection.count(), db.instagramFeedState.count(), db.instagramFeedPost.count(),
  ]));
  console.table(Object.fromEntries([
    "Product", "Category", "ProductImage", "ProductPaymentPrice",
    "HomeCategoryCard", "InstagramMediaEntry", "CloudinaryCleanup", "Media",
    "InstagramConnection", "InstagramFeedState", "InstagramFeedPost",
  ].map((name, index) => [name, counts[index]])));
  if (process.argv.includes("--summary")) return;

  const queriesBefore = queryDurations.length;
  const [saved] = await timed("Lectura relacional del storefront", readMeasuredSnapshot);
  console.log("Secciones guardadas:", [...saved.savedSections].sort().join(", "));
  const snapshotQueries = queryDurations.slice(queriesBefore);
  console.log("Consultas del storefront:", snapshotQueries.length,
    "tiempo SQL acumulado:", snapshotQueries.reduce((sum, value) => sum + value, 0), "ms",
    "consulta más lenta:", Math.max(...snapshotQueries, 0), "ms");

  const catalogPlan = await timed("Plan del catálogo", () => db.$queryRaw<Record<string, unknown>[]>`
    EXPLAIN SELECT id, categoryId, name, price, image, position FROM Product ORDER BY position, id
  `);
  console.table(catalogPlan);

  const sample = await db.product.findFirst({ select: { id: true } });
  if (sample) {
    const pricePlan = await timed("Plan de precios por producto", () => db.$queryRaw<Record<string, unknown>[]>`
      EXPLAIN SELECT id, label, price FROM ProductPaymentPrice
      WHERE productId = ${sample.id} AND active = true ORDER BY position, id
    `);
    console.table(pricePlan);
  }
}

main().catch((error: unknown) => {
  const name = error instanceof Error ? error.name : "Error desconocido";
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "sin código";
  console.error(`No se pudo auditar TiDB (${name}, ${code}).`);
  process.exitCode = 1;
}).finally(() => db.$disconnect());
