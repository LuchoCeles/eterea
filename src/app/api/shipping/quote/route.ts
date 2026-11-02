import { NextResponse } from "next/server";
import { validPostalCode } from "@/lib/shipping";
import { CorreoArgentinoError, quoteCorreoArgentino } from "@/server/correo-argentino";
import { consumeRateLimit } from "@/server/rate-limit";

const MAX_REQUEST_BYTES = 512;

async function limitedJson(request: Request): Promise<{ body: unknown; tooLarge: boolean }> {
  const announced = request.headers.get("content-length");
  if (announced !== null && !/^\d+$/.test(announced)) return { body: null, tooLarge: false };
  if (announced !== null && Number(announced) > MAX_REQUEST_BYTES) return { body: null, tooLarge: true };
  const reader = request.body?.getReader();
  if (!reader) return { body: null, tooLarge: false };
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_REQUEST_BYTES) {
      await reader.cancel().catch(() => undefined);
      return { body: null, tooLarge: true };
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try {
    return { body: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)), tooLarge: false };
  } catch {
    return { body: null, tooLarge: false };
  }
}

export async function POST(request: Request) {
  const { body, tooLarge } = await limitedJson(request).catch(() => ({ body: null, tooLarge: false }));
  if (tooLarge) return NextResponse.json({ error: "La solicitud es demasiado grande." }, { status: 413 });
  const input = body && typeof body === "object" ? body as Record<string, unknown> : null;
  if (!input || typeof input.postalCode !== "string" || !validPostalCode(input.postalCode) ||
    !Number.isSafeInteger(input.quantity) || (input.quantity as number) < 1 || (input.quantity as number) > 50 ||
    (input.deliveryType !== "D" && input.deliveryType !== "S"))
    return NextResponse.json({ error: "Ingresá un código postal, una cantidad y un tipo de entrega válidos." }, { status: 400 });
  try {
    const limit = await consumeRateLimit("envios:global", 600, 15 * 60);
    if (!limit.allowed) return NextResponse.json({ error: "Hay demasiadas cotizaciones. Probá de nuevo más tarde." }, {
      status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds), "Cache-Control": "private, no-store" },
    });
    return NextResponse.json(await quoteCorreoArgentino(input.postalCode, input.quantity as number, input.deliveryType), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    const message = error instanceof CorreoArgentinoError ? error.message : "No pudimos calcular el envío. Intentá de nuevo.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
