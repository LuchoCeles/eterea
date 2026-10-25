import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/server/auth";
import { hasInstagramConnection, InstagramConnectionError, saveInstagramConnection } from "@/server/instagram";

const tokenSchema = z.object({ token: z.string().trim().min(20).max(4000) });
const privateHeaders = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: "No autorizado." }, { status: 401, headers: privateHeaders });
  try {
    return NextResponse.json({ saved: await hasInstagramConnection() }, { headers: privateHeaders });
  } catch {
    return NextResponse.json({ error: "No se pudo consultar la conexión de Instagram." }, { status: 500, headers: privateHeaders });
  }
}

export async function PUT(request: Request) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: "No autorizado." }, { status: 401, headers: privateHeaders });
  const body: unknown = await request.json().catch(() => null);
  const parsed = tokenSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ingresá un token de Instagram válido." }, { status: 400, headers: privateHeaders });
  }

  try {
    await saveInstagramConnection(parsed.data.token);
    return NextResponse.json({ saved: true }, { headers: privateHeaders });
  } catch (error) {
    const message = error instanceof InstagramConnectionError ? error.message : "No se pudo guardar el token de Instagram.";
    return NextResponse.json({ error: message }, { status: error instanceof InstagramConnectionError ? 400 : 500, headers: privateHeaders });
  }
}
