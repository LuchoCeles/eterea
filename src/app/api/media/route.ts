import { NextResponse } from "next/server";
import { isAdminRequest } from "@/server/auth";
import { imageSections } from "@/lib/media";
import {
  CloudinaryUploadCollisionError,
  cloudinaryPublicId,
  deleteCloudinaryPublicId,
  newCloudinaryPublicId,
  uploadCloudinaryImage,
} from "@/server/cloudinary";
import {
  completePendingUpload,
  deleteUnreferencedImages,
  releasePendingUpload,
  reservePendingUpload,
  sweepPendingUploads,
} from "@/server/content";
import { validateImageFile } from "@/server/media";

export async function GET(request: Request) {
  if (!(await isAdminRequest(request)))
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const url = new URL(request.url).searchParams.get("url");
  const asset = url && cloudinaryPublicId(url);
  if (
    !url ||
    !asset ||
    asset.cloudName !== process.env.CLOUDINARY_CLOUD_NAME ||
    !asset.publicId.startsWith("eterea/productos/imagenes/")
  ) {
    return NextResponse.json({ error: "La imagen del producto no es válida." }, { status: 400 });
  }
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15_000), redirect: "error" });
    const length = Number(response.headers.get("content-length") ?? 0);
    if (!response.ok || (length && length > 50_000_000))
      throw new Error("No se pudo abrir la imagen.");
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > 50_000_000) throw new Error("La imagen es demasiado grande.");
    const type = response.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) throw new Error("El archivo no es una imagen.");
    return new Response(bytes, {
      headers: { "Content-Type": type, "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo abrir la imagen. Intentá de nuevo." },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  if (!(await isAdminRequest(request)))
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  const section = formData?.get("section");
  if (!(file instanceof File))
    return NextResponse.json({ error: "Seleccioná una imagen." }, { status: 400 });
  if (
    typeof section !== "string" ||
    !imageSections.includes(section as (typeof imageSections)[number])
  ) {
    return NextResponse.json({ error: "La sección de destino no es válida." }, { status: 400 });
  }
  try {
    validateImageFile(file);
    const imageSection = section as (typeof imageSections)[number];
    const publicId = newCloudinaryPublicId(imageSection);
    try {
      await reservePendingUpload(publicId);
    } catch {
      throw new Error("No se pudo preparar la carga de la imagen. Intentá de nuevo.");
    }
    let url: string;
    try {
      url = await uploadCloudinaryImage(file, imageSection, publicId);
      await completePendingUpload(publicId, url);
    } catch (error) {
      if (error instanceof CloudinaryUploadCollisionError) {
        await releasePendingUpload(publicId);
        throw error;
      }
      await deleteCloudinaryPublicId(publicId)
        .then(() => releasePendingUpload(publicId))
        .catch((cleanupError: unknown) => {
          console.error("No se pudo limpiar una carga incompleta de Cloudinary.", {
            publicId,
            error: cleanupError,
          });
        });
      throw new Error("No se pudo completar la carga de la imagen. Intentá de nuevo.");
    }
    await sweepPendingUploads().catch(() => undefined);
    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo subir la imagen.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdminRequest(request)))
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { urls?: unknown } | null;
  if (
    !Array.isArray(body?.urls) ||
    body.urls.length > 20 ||
    !body.urls.every((url) => typeof url === "string" && cloudinaryPublicId(url))
  ) {
    return NextResponse.json(
      { error: "La lista de imágenes para limpiar no es válida." },
      { status: 400 },
    );
  }
  try {
    const result = await deleteUnreferencedImages(body.urls as string[]);
    return NextResponse.json(result, { status: result.failed ? 502 : 200 });
  } catch {
    return NextResponse.json(
      { error: "No se pudo limpiar la subida incompleta." },
      { status: 502 },
    );
  }
}
