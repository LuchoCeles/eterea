export type RateLimitBucketSnapshot = { attemptCount: number; resetAt: Date };
export type RateLimitStore = {
  consume(bucketKey: string, now: Date, resetAt: Date): Promise<RateLimitBucketSnapshot>;
};

export async function consumeRateLimitWithStore(
  store: RateLimitStore,
  bucketKey: string,
  limit: number,
  windowSeconds: number,
  now = new Date(),
) {
  if (!Number.isSafeInteger(limit) || limit < 1 || !Number.isSafeInteger(windowSeconds) || windowSeconds < 1) {
    throw new Error("El límite de solicitudes no es válido.");
  }
  const resetAt = new Date(now.getTime() + windowSeconds * 1000);
  const bucket = await store.consume(bucketKey, now, resetAt);
  return {
    allowed: bucket.attemptCount <= limit,
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt.getTime() - now.getTime()) / 1000)),
  };
}
