import { NextResponse } from "next/server";
import { isAdminRequest } from "@/server/auth";
import { shippingSettingsSchema } from "@/lib/shipping-settings";
import { saveAdminShippingSettings, ShippingSettingsError } from "@/server/shipping-settings";

const headers = { "Cache-Control": "private, no-store" };

export async function PUT(request: Request) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: "No autorizado." }, { status: 401, headers });
  const body: unknown = await request.json().catch(() => null);
  const parsed = shippingSettingsSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Completá todos los datos requeridos con valores válidos." }, { status: 400, headers });
  try {
    return NextResponse.json(await saveAdminShippingSettings(parsed.data), { headers });
  } catch (error) {
    const message = error instanceof ShippingSettingsError ? error.message : "No se pudo guardar la configuración de envíos.";
    return NextResponse.json({ error: message }, { status: error instanceof ShippingSettingsError ? error.status : 500, headers });
  }
}
