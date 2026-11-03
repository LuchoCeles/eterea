import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { consumeRateLimitWithStore, type RateLimitBucketSnapshot, type RateLimitStore } from "../lib/rate-limit-policy";

function fakeStore(): RateLimitStore {
  const rows = new Map<string, RateLimitBucketSnapshot>();
  return {
    async consume(key, now, resetAt) {
      const previous = rows.get(key);
      const next = !previous || previous.resetAt <= now
        ? { attemptCount: 1, resetAt }
        : { attemptCount: previous.attemptCount + 1, resetAt: previous.resetAt };
      rows.set(key, next);
      return next;
    },
  };
}

describe("Política de límite compartido", () => {
  it("bloquea el intento siguiente al cupo y renueva la ventana al vencer", async () => {
    const store = fakeStore();
    const start = new Date("2026-11-02T12:00:00.000Z");
    for (let attempt = 1; attempt <= 8; attempt += 1) {
      assert.equal((await consumeRateLimitWithStore(store, "login:usuario", 8, 900, start)).allowed, true);
    }
    const blocked = await consumeRateLimitWithStore(store, "login:usuario", 8, 900, start);
    assert.deepEqual(blocked, { allowed: false, retryAfterSeconds: 900 });
    const renewed = await consumeRateLimitWithStore(store, "login:usuario", 8, 900,
      new Date(start.getTime() + 900_000));
    assert.deepEqual(renewed, { allowed: true, retryAfterSeconds: 900 });
  });

  it("mantiene cupos independientes para distintas claves", async () => {
    const store = fakeStore();
    const now = new Date("2026-11-02T12:00:00.000Z");
    await consumeRateLimitWithStore(store, "envios:global", 1, 60, now);
    assert.equal((await consumeRateLimitWithStore(store, "envios:global", 1, 60, now)).allowed, false);
    assert.equal((await consumeRateLimitWithStore(store, "login:global", 1, 60, now)).allowed, true);
  });
});
