import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/server/auth";
import { disconnectInstagramConnection, instagramConnectionStatus, InstagramConnectionError, saveInstagramConnection, validateInstagramConnection } from "@/server/instagram";
import { invalidateStorefrontContent } from "@/server/storefront-content";

const connectionSchema = z.object({
  token: z.string().trim().min(20).max(4000),
  accountId: z.string().trim().regex(/^\d{1,32}$/),
});
const confirmationSchema = connectionSchema.extend({ confirmUsername: z.string().trim().min(1).max(30) });
const privateHeaders = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: "No autorizado." }, { status: 401, headers: privateHeaders });
  try {
    return NextResponse.json(await instagramConnectionStatus(), { headers: privateHeaders });
  } catch {
    return NextResponse.json({ error: "No se pudo consultar la conexión de Instagram." }, { status: 500, headers: privateHeaders });
  }
}

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: "No autorizado." }, { status: 401, headers: privateHeaders });
  const body: unknown = await request.json().catch(() => null);
  const parsed = connectionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ingresá un token de Meta y un ID de cuenta de Instagram válidos." }, { status: 400, headers: privateHeaders });
  }

  try {
    const profile = await validateInstagramConnection(parsed.data.token, parsed.data.accountId);
    return NextResponse.json({ valid: true, username: profile.username, accountId: profile.id, sampleCount: profile.sampleCount }, { headers: privateHeaders });
  } catch (error) {
    const message = error instanceof InstagramConnectionError ? error.message : "No se pudo validar la conexión con Instagram.";
    return NextResponse.json({ error: message }, { status: error instanceof InstagramConnectionError ? error.status : 500, headers: privateHeaders });
  }
}

export async function PUT(request: Request) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: "No autorizado." }, { status: 401, headers: privateHeaders });
  const body: unknown = await request.json().catch(() => null);
  const parsed = confirmationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validá la cuenta antes de confirmar la conexión." }, { status: 400, headers: privateHeaders });
  }

  try {
    const profile = await saveInstagramConnection(parsed.data.token, parsed.data.accountId, parsed.data.confirmUsername);
    invalidateStorefrontContent();
    return NextResponse.json({ saved: true, username: profile.username, accountId: profile.id }, { headers: privateHeaders });
  } catch (error) {
    const message = error instanceof InstagramConnectionError ? error.message : "No se pudo guardar la conexión de Instagram.";
    return NextResponse.json({ error: message }, { status: error instanceof InstagramConnectionError ? error.status : 500, headers: privateHeaders });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: "No autorizado." }, { status: 401, headers: privateHeaders });
  try {
    await disconnectInstagramConnection();
    invalidateStorefrontContent();
    return NextResponse.json({ saved: false }, { headers: privateHeaders });
  } catch {
    return NextResponse.json({ error: "No se pudo desvincular la cuenta de Instagram." }, { status: 500, headers: privateHeaders });
  }
}
