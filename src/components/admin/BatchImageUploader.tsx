"use client";

import { Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { ImageSection } from "@/lib/media";
import { uploadImages } from "@/lib/media-client";

export function BatchImageUploader({
  section,
  onUploaded,
}: {
  section: ImageSection;
  onUploaded: (urls: string[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const onUploadedRef = useRef(onUploaded);
  onUploadedRef.current = onUploaded;
  return (
    <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-primary/25 bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10">
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
      {busy ? "Subiendo fotos…" : "Subir varias fotos"}
      <input
        type="file"
        accept="image/avif,image/gif,image/jpeg,image/png,image/webp"
        multiple
        disabled={busy}
        className="hidden"
        onChange={async (event) => {
          const input = event.currentTarget;
          const files = Array.from(input.files ?? []);
          input.value = "";
          if (!files.length) return;
          if (files.length > 20) {
            toast.error("Podés subir hasta 20 fotos por tanda.");
            return;
          }
          if (files.some((file) => file.size > 50_000_000)) {
            toast.error("Cada imagen puede pesar hasta 50 MB.");
            return;
          }
          setBusy(true);
          try {
            const urls = await uploadImages(files, section);
            onUploadedRef.current(urls);
            toast.success(`Se cargaron ${urls.length} fotos. Guardá los cambios para publicarlas.`);
          } catch {
            toast.error(
              "No se pudieron subir todas las fotos. Revisá la conexión e intentá de nuevo.",
            );
          } finally {
            setBusy(false);
          }
        }}
      />
    </label>
  );
}
