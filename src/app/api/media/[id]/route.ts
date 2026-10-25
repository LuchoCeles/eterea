import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { verifyMediaSignature } from "@/server/media";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(request.url);
  if (!verifyMediaSignature(id, url.searchParams.get("expires"), url.searchParams.get("signature"))) {
    return new Response("Enlace vencido o inválido.", { status: 403 });
  }
  const media = await prisma.media.findUnique({ where: { id }, select: { contentType: true, bytes: true } });
  if (!media) return new Response("Imagen no encontrada.", { status: 404 });
  return new Response(Buffer.from(media.bytes), {
    headers: {
      "Content-Type": media.contentType,
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}