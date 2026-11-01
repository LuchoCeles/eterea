import { NextResponse } from "next/server";
import { validPostalCode } from "@/lib/shipping";
import { CorreoArgentinoError, quoteCorreoArgentino } from "@/server/correo-argentino";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.postalCode !== "string" || !validPostalCode(body.postalCode) ||
    !Number.isSafeInteger(body.quantity) || body.quantity < 1 || body.quantity > 50)
    return NextResponse.json({ error: "Ingresá un código postal de 4 números y una cantidad válida." }, { status: 400 });
  try {
    return NextResponse.json(await quoteCorreoArgentino(body.postalCode, body.quantity), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    const message = error instanceof CorreoArgentinoError ? error.message : "No pudimos calcular el envío. Intentá de nuevo.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
