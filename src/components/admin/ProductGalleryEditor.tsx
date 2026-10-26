"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, Star, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { ProductImage } from "@/components/store/ProductImage";
import { uploadImages } from "@/lib/media-client";

const MAX_IMAGES = 5;

export function ProductGalleryEditor({ images, onChange, onUploaded }: {
  images: string[];
  onChange: (images: string[]) => void;
  onUploaded: (urls: string[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const callbacks = useRef({ images, onChange, onUploaded });
  callbacks.current = { images, onChange, onUploaded };

  function move(from: number, to: number) {
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  return (
    <section className="space-y-3 border-b pb-5" aria-label="Fotos del producto">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium">Fotos del producto</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Hasta cinco fotos. La primera es la portada del catálogo y de la ficha.</p>
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">{images.length}/{MAX_IMAGES}</span>
      </div>

      {images.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((url, index) => (
            <div key={url} className="overflow-hidden rounded-xl border bg-card">
              <div className="relative aspect-[3/4] bg-secondary/40">
                <ProductImage src={url} alt={`Foto ${index + 1} del producto`} sizes="(min-width: 640px) 33vw, 50vw" className="h-full w-full object-cover" />
                {index === 0 && <span className="absolute left-2 top-2 rounded-full bg-background/95 px-2 py-1 text-[11px] font-medium text-foreground shadow-sm">Portada</span>}
              </div>
              <div className="space-y-2 p-2">
                {index > 0 && (
                  <button type="button" disabled={busy} onClick={() => move(index, 0)} className="flex min-h-9 w-full items-center justify-center gap-1 rounded-lg border px-2 text-xs hover:bg-secondary disabled:opacity-50">
                    <Star className="h-3.5 w-3.5" /> Elegir portada
                  </button>
                )}
                <div className="flex items-center justify-between gap-1">
                  <button type="button" disabled={busy || index === 0} onClick={() => move(index, index - 1)} aria-label={`Mover foto ${index + 1} hacia el inicio`} className="grid h-9 w-9 place-items-center rounded-lg border hover:bg-secondary disabled:opacity-40"><ArrowLeft className="h-4 w-4" /></button>
                  <span className="text-xs tabular-nums text-muted-foreground">{index + 1} de {images.length}</span>
                  <button type="button" disabled={busy || index === images.length - 1} onClick={() => move(index, index + 1)} aria-label={`Mover foto ${index + 1} hacia el final`} className="grid h-9 w-9 place-items-center rounded-lg border hover:bg-secondary disabled:opacity-40"><ArrowRight className="h-4 w-4" /></button>
                  <button type="button" disabled={busy} onClick={() => onChange(images.filter((_, current) => current !== index))} aria-label={`Quitar foto ${index + 1}`} className="grid h-9 w-9 place-items-center rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 disabled:opacity-40"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : <p className="rounded-xl border border-dashed p-5 text-center text-xs text-muted-foreground">Todavía no cargaste fotos para esta prenda.</p>}

      {images.length < MAX_IMAGES && (
        <label className={`inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary/25 bg-primary/5 px-4 py-2 text-sm font-medium text-primary ${busy ? "cursor-wait opacity-60" : "cursor-pointer hover:bg-primary/10"}`}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {busy ? "Subiendo fotos…" : "Agregar fotos"}
          <input type="file" accept="image/avif,image/gif,image/jpeg,image/png,image/webp" multiple disabled={busy} className="hidden" onChange={async (event) => {
            const files = Array.from(event.currentTarget.files ?? []);
            event.currentTarget.value = "";
            if (!files.length) return;
            if (files.length > MAX_IMAGES - callbacks.current.images.length) {
              toast.error(`Podés agregar ${MAX_IMAGES - callbacks.current.images.length} ${MAX_IMAGES - callbacks.current.images.length === 1 ? "foto" : "fotos"} más.`);
              return;
            }
            setBusy(true);
            try {
              const urls = await uploadImages(files, "productos");
              callbacks.current.onUploaded(urls);
              callbacks.current.onChange([...callbacks.current.images, ...urls]);
              toast.success("Fotos cargadas. Guardá los cambios para publicarlas.");
            } catch {
              toast.error("No se pudieron subir las fotos. Intentá de nuevo.");
            } finally {
              setBusy(false);
            }
          }} />
        </label>
      )}
    </section>
  );
}
