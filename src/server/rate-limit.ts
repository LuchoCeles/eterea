import "server-only";
import { consumeRateLimitWithStore, type RateLimitStore } from "@/lib/rate-limit-policy";
import { prisma } from "@/server/prisma";

/** El contador compartido evita que cada instancia conceda su propio cupo. */
const store: RateLimitStore = {
  async consume(bucketKey, now, resetAt) {
    await prisma.$executeRaw`
      INSERT INTO RateLimitBucket (bucketKey, attemptCount, resetAt)
      VALUES (${bucketKey}, 1, ${resetAt})
      ON DUPLICATE KEY UPDATE
        attemptCount = IF(resetAt <= ${now}, 1, LEAST(attemptCount + 1, 2147483647)),
        resetAt = IF(resetAt <= ${now}, ${resetAt}, resetAt)
    `;
    const bucket = await prisma.rateLimitBucket.findUnique({ where: { bucketKey } });
    if (!bucket) throw new Error("No se pudo consultar el límite de solicitudes.");
    return bucket;
  },
};

export function consumeRateLimit(bucketKey: string, limit: number, windowSeconds: number) {
  return consumeRateLimitWithStore(store, bucketKey, limit, windowSeconds);
}

export async function clearRateLimit(bucketKey: string) {
  await prisma.rateLimitBucket.deleteMany({ where: { bucketKey } });
}
