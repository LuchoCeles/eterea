import { after, NextResponse } from "next/server";
import { ContentKey } from "@/lib/content";
import { ContentValidationError, contentKeys, drainCloudinaryCleanupQueue, saveContentAndCleanImages } from "@/server/content";
import { isAdminRequest } from "@/server/auth";
import { contentSchemas } from "@/lib/content-schema";
import { invalidateStorefrontContent } from "@/server/storefront-content";

export async function PUT(request: Request, { params }: { params: Promise<{ key: string }> }) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const { key } = await params;
  if (key === "instagram" || !contentKeys.includes(key as ContentKey)) return NextResponse.json({ error: "Sección desconocida." }, { status: 404 });

  try {
    const body: unknown = await request.json();
    const data = body && typeof body === "object" && "data" in body ? body.data : body;
    if (key === "contact" && data && typeof data === "object" && "instagramUsername" in data) {
      return NextResponse.json({ error: "El usuario de Instagram se obtiene de la cuenta conectada con Meta." }, { status: 400 });
    }
    const uploadedUrls = body && typeof body === "object" && "uploadedUrls" in body && Array.isArray(body.uploadedUrls)
      ? body.uploadedUrls.filter((url): url is string => typeof url === "string")
      : [];
    const parsed = contentSchemas[key as ContentKey].safeParse(data);
    if (!parsed.success) return NextResponse.json({ error: key === "categories" ? "Cada categoría necesita un nombre válido." : "El formato del contenido no es válido." }, { status: 400 });
    const result = await saveContentAndCleanImages(key as ContentKey, parsed.data, uploadedUrls);
    invalidateStorefrontContent();
    if (result.cleanupPending) {
      after(async () => {
        try {
          await drainCloudinaryCleanupQueue();
        } catch (error) {
          console.error("No se pudo completar la limpieza de fotos pendientes.", error);
        }
      });
    }
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ContentValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ error: "No se pudo guardar el contenido." }, { status: 400 });
  }
}
