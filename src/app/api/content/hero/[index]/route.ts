import { after, NextResponse } from "next/server";
import { isAdminRequest } from "@/server/auth";
import { ContentValidationError, drainCloudinaryCleanupQueue, saveSingleHeroSlide } from "@/server/content";
import { invalidateStorefrontContent } from "@/server/storefront-content";

export async function PATCH(request: Request, { params }: { params: Promise<{ index: string }> }) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const { index } = await params;
  const position = Number(index);
  if (!/^\d+$/.test(index)) return NextResponse.json({ error: "El banner elegido no es válido." }, { status: 400 });
  try {
    const body = await request.json() as { slide?: unknown; uploadedUrls?: unknown };
    const uploadedUrls = Array.isArray(body.uploadedUrls)
      ? body.uploadedUrls.filter((url): url is string => typeof url === "string") : [];
    const result = await saveSingleHeroSlide(position, body.slide, uploadedUrls);
    invalidateStorefrontContent();
    if (result.cleanupPending) after(() => drainCloudinaryCleanupQueue().catch(() => undefined));
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof ContentValidationError ? error.message : "No se pudo guardar el banner.";
    return NextResponse.json({ error: message }, { status: error instanceof ContentValidationError ? 400 : 500 });
  }
}
