import { NextResponse } from "next/server";
import { isAdminRequest } from "@/server/auth";
import { imageSections } from "@/lib/media";
import { cloudinaryPublicId, uploadCloudinaryImage } from "@/server/cloudinary";
import { deleteUnreferencedImages } from "@/server/content";

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  const section = formData?.get("section");
  if (!(file instanceof File)) return NextResponse.json({ error: "Seleccioná una imagen." }, { status: 400 });
  if (typeof section !== "string" || !imageSections.includes(section as (typeof imageSections)[number])) {
    return NextResponse.json({ error: "La sección de destino no es válida." }, { status: 400 });
  }
  try {
    return NextResponse.json({ url: await uploadCloudinaryImage(file, section as (typeof imageSections)[number]) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo subir la imagen.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { urls?: unknown } | null;
  if (!Array.isArray(body?.urls) || body.urls.length > 20 || !body.urls.every((url) => typeof url === "string" && cloudinaryPublicId(url))) {
    return NextResponse.json({ error: "La lista de imágenes para limpiar no es válida." }, { status: 400 });
  }
  try {
    const result = await deleteUnreferencedImages(body.urls as string[]);
    return NextResponse.json(result, { status: result.failed ? 502 : 200 });
  } catch {
    return NextResponse.json({ error: "No se pudo limpiar la subida incompleta." }, { status: 502 });
  }
}
