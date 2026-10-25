import { after, NextResponse } from "next/server";
import { textSectionKeys, textSectionSchemas } from "@/lib/content-schema";
import type { TextSectionKey } from "@/lib/content";
import { isAdminRequest } from "@/server/auth";
import { ContentValidationError, deleteUnreferencedImages, saveTextSection } from "@/server/content";

export async function PATCH(request: Request, { params }: { params: Promise<{ section: string }> }) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const { section } = await params;
  if (!textSectionKeys.includes(section as TextSectionKey)) {
    return NextResponse.json({ error: "Sección desconocida." }, { status: 404 });
  }

  try {
    const body: unknown = await request.json();
    const data = body && typeof body === "object" && "data" in body ? body.data : undefined;
    const uploadedUrls = body && typeof body === "object" && "uploadedUrls" in body && Array.isArray(body.uploadedUrls)
      ? body.uploadedUrls.filter((url): url is string => typeof url === "string")
      : [];
    const parsed = textSectionSchemas[section as TextSectionKey].safeParse(data);
    if (!parsed.success) return NextResponse.json({ error: "El formato de esta sección no es válido." }, { status: 400 });
    const result = await saveTextSection(section as TextSectionKey, parsed.data, uploadedUrls);
    if (result.cleanupUrls.length) {
      after(async () => {
        try {
          await deleteUnreferencedImages(result.cleanupUrls);
        } catch (error) {
          console.error("No se pudo completar la limpieza de fotos pendientes.", error);
        }
      });
    }
    return NextResponse.json({ data: result.data });
  } catch (error) {
    if (error instanceof ContentValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("No se pudo guardar la sección del inicio.", error);
    return NextResponse.json({ error: "No se pudo guardar la sección. Intentá de nuevo." }, { status: 500 });
  }
}
