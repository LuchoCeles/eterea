type DestroyResponse = { result?: string };

export async function destroyCloudinaryAsset(
  endpoint: string,
  authorization: string,
  publicId: string,
  request: typeof fetch = fetch,
) {
  const body = new FormData();
  body.set("public_id", publicId);
  body.set("invalidate", "true");
  const response = await request(endpoint, {
    method: "POST",
    headers: { Authorization: authorization },
    body,
    signal: AbortSignal.timeout(30_000),
  });
  const payload = (await response.json().catch(() => ({}))) as DestroyResponse;
  if (!response.ok || (payload.result !== "ok" && payload.result !== "not found")) {
    throw new Error("Cloudinary no pudo borrar la imagen.");
  }
}
