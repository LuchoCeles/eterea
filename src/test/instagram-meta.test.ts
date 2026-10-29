import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { InstagramMetaError, validateInstagramAccount } from "../server/instagram-meta";

const accountId = "11111111111111111";
const testToken = "token-sintetico-no-utilizable-en-meta";

function jsonResponse(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } });
}

describe("Instagram Unified Login mediante Graph API", () => {
  it("valida perfil y lectura de publicaciones con el ID configurado", async () => {
    const requests: { url: string; authorization: string | null }[] = [];
    const fetcher: typeof fetch = async (input, init) => {
      const url = String(input);
      requests.push({ url, authorization: new Headers(init?.headers).get("Authorization") });
      if (url.endsWith(`/${accountId}?fields=id,username`)) return jsonResponse({ id: accountId, username: "eterea.newconcept" });
      if (url.endsWith(`/${accountId}/media?fields=id,caption,media_type,media_url,permalink,timestamp&limit=1`)) {
        return jsonResponse({ data: [{ id: "post-test-1" }, { id: "post-test-2" }] });
      }
      return jsonResponse({ error: { code: 100 } }, 400);
    };

    const result = await validateInstagramAccount(testToken, accountId, fetcher);
    assert.deepEqual(result, { id: accountId, username: "eterea.newconcept", sampleCount: 2 });
    assert.equal(requests.length, 2);
    assert.ok(requests.every(({ url }) => url.startsWith("https://graph.facebook.com/v25.0/")));
    assert.ok(requests.every(({ authorization }) => authorization === `Bearer ${testToken}`));
    assert.ok(!requests.some(({ url }) => /\/me(?:\?|\/|$)/.test(url)));
  });

  it("clasifica un token rechazado sin exponerlo en el error", async () => {
    const fetcher: typeof fetch = async () => jsonResponse({ error: { code: 190 } }, 400);
    const statusFetcher: typeof fetch = async () => jsonResponse({ error: "No autorizado" }, 401);
    await assert.rejects(
      validateInstagramAccount(testToken, accountId, fetcher),
      (error: unknown) => error instanceof InstagramMetaError && error.reason === "token" && !error.message.includes(testToken),
    );
    await assert.rejects(validateInstagramAccount(testToken, accountId, statusFetcher), (error: unknown) =>
      error instanceof InstagramMetaError && error.reason === "token",
    );
  });

  it("distingue permisos faltantes de una cuenta inaccesible", async () => {
    const permissionFetcher: typeof fetch = async () => jsonResponse({ error: { code: 200 } }, 403);
    const accountFetcher: typeof fetch = async () => jsonResponse({ error: { code: 100 } }, 400);
    await assert.rejects(validateInstagramAccount(testToken, accountId, permissionFetcher), (error: unknown) =>
      error instanceof InstagramMetaError && error.reason === "permission" && error.status === 403,
    );
    await assert.rejects(validateInstagramAccount(testToken, accountId, accountFetcher), (error: unknown) =>
      error instanceof InstagramMetaError && error.reason === "account",
    );
  });

  it("maneja una falla de red sin devolver detalles internos", async () => {
    const fetcher: typeof fetch = async () => { throw new Error(`Fallo de red con ${testToken}`); };
    await assert.rejects(validateInstagramAccount(testToken, accountId, fetcher), (error: unknown) =>
      error instanceof InstagramMetaError && error.reason === "unavailable" && error.status === 502 && !error.message.includes(testToken),
    );
  });

  it("requiere que el perfil y su feed devuelvan estructuras válidas", async () => {
    const wrongProfile: typeof fetch = async () => jsonResponse({ id: "otra-cuenta", username: "eterea.newconcept" });
    const emptyFeedBody: typeof fetch = async (input) => String(input).includes("/media?")
      ? jsonResponse({ data: null })
      : jsonResponse({ id: accountId, username: "eterea.newconcept" });
    await assert.rejects(validateInstagramAccount(testToken, accountId, wrongProfile), (error: unknown) =>
      error instanceof InstagramMetaError && error.reason === "invalid_response",
    );
    await assert.rejects(validateInstagramAccount(testToken, accountId, emptyFeedBody), (error: unknown) =>
      error instanceof InstagramMetaError && error.reason === "unavailable",
    );
  });
});
