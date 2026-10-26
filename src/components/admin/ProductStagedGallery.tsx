"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Crop, ImagePlus, RotateCcw, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ProductImageEditor, type CropPosition } from "@/components/admin/ProductImageEditor";
import { ProductImage } from "@/components/store/ProductImage";

export type GalleryItem = {
  id: string;
  url: string;
  file?: File;
  originalUrl?: string;
  originalFile?: File;
  cropped?: boolean;
  cropPosition?: CropPosition;
};
export const MAX_PRODUCT_IMAGES = 5;
const IMAGE_TYPES = new Set(["image/avif", "image/gif", "image/jpeg", "image/png", "image/webp"]);

export function ProductStagedGallery({
  items,
  onChange,
  onObjectUrl,
  disabled,
}: {
  items: GalleryItem[];
  onChange: (items: GalleryItem[]) => void;
  onObjectUrl: (url: string) => void;
  disabled?: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editing = items.find((item) => item.id === editingId);

  function move(from: number, to: number) {
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  function add(files: File[]) {
    const free = MAX_PRODUCT_IMAGES - items.length;
    if (files.length > free) {
      toast.error(`Podés agregar ${free} ${free === 1 ? "foto" : "fotos"} más.`);
      return;
    }
    if (files.some((file) => !IMAGE_TYPES.has(file.type) || !file.size || file.size > 50_000_000)) {
      toast.error("Usá imágenes JPEG, PNG, WebP, GIF o AVIF de hasta 50 MB.");
      return;
    }
    onChange([
      ...items,
      ...files.map((file) => {
        const url = URL.createObjectURL(file);
        onObjectUrl(url);
        return { id: crypto.randomUUID(), url, file, originalUrl: url, originalFile: file };
      }),
    ]);
  }

  return (
    <section
      className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5"
      aria-label="Fotos del producto"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Fotos del producto</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            La primera foto será la portada. Podés rehacer cada recorte desde la foto original antes
            de guardar.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold tabular-nums">
          {items.length}/{MAX_PRODUCT_IMAGES}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
        {items.map((item, index) => (
          <div key={item.id} className="group overflow-hidden rounded-xl border bg-background">
            <div className="relative aspect-[3/4] overflow-hidden bg-secondary/50">
              <ProductImage
                src={item.url}
                alt={`Foto ${index + 1} del producto`}
                className="h-full w-full object-cover"
              />
              {index === 0 && (
                <span className="absolute left-2 top-2 rounded-full bg-background px-2 py-1 text-[11px] font-semibold shadow-sm">
                  Portada
                </span>
              )}
              {item.file && (
                <span className="absolute bottom-2 left-2 rounded-full bg-background/95 px-2 py-1 text-[10px] font-medium shadow-sm">
                  Lista para guardar
                </span>
              )}
            </div>
            <div className="space-y-2 p-2">
              <button
                type="button"
                onClick={() => setEditingId(item.id)}
                disabled={disabled}
                className="flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border text-xs font-medium hover:bg-secondary disabled:opacity-50"
              >
                <Crop className="h-3.5 w-3.5" />
                Recortar y ampliar
              </button>
              {item.cropped && item.originalUrl && (
                <button
                  type="button"
                  onClick={() =>
                    onChange(
                      items.map((current) =>
                        current.id === item.id
                          ? {
                              ...current,
                              url: current.originalUrl!,
                              file: current.originalFile,
                              cropped: false,
                              cropPosition: undefined,
                            }
                          : current,
                      ),
                    )
                  }
                  disabled={disabled}
                  className="flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border text-xs hover:bg-secondary disabled:opacity-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Volver a la original
                </button>
              )}
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => move(index, 0)}
                  disabled={disabled}
                  className="flex min-h-9 w-full items-center justify-center gap-1 rounded-lg border text-xs hover:bg-secondary disabled:opacity-50"
                >
                  <Star className="h-3.5 w-3.5" />
                  Usar de portada
                </button>
              )}
              <div className="flex items-center justify-between gap-1">
                <button
                  type="button"
                  onClick={() => move(index, index - 1)}
                  disabled={disabled || index === 0}
                  aria-label={`Mover foto ${index + 1} hacia el inicio`}
                  className="grid h-9 w-9 place-items-center rounded-lg border hover:bg-secondary disabled:opacity-40"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {index + 1} de {items.length}
                </span>
                <button
                  type="button"
                  onClick={() => move(index, index + 1)}
                  disabled={disabled || index === items.length - 1}
                  aria-label={`Mover foto ${index + 1} hacia el final`}
                  className="grid h-9 w-9 place-items-center rounded-lg border hover:bg-secondary disabled:opacity-40"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onChange(items.filter((current) => current.id !== item.id))}
                  disabled={disabled}
                  aria-label={`Quitar foto ${index + 1}`}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {items.length < MAX_PRODUCT_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 text-center text-primary transition-colors hover:bg-primary/10 disabled:opacity-50 sm:min-h-56"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10">
              <ImagePlus className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold">Agregar fotos</span>
            <span className="text-xs text-muted-foreground">Elegí varias a la vez</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/avif,image/gif,image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        disabled={disabled || items.length >= MAX_PRODUCT_IMAGES}
        onChange={(event) => {
          add(Array.from(event.currentTarget.files ?? []));
          event.currentTarget.value = "";
        }}
      />
      {editing && (
        <ProductImageEditor
          source={editing.originalUrl ?? editing.url}
          initialPosition={editing.cropPosition}
          onClose={() => setEditingId(null)}
          onApply={(file, cropPosition) => {
            const url = URL.createObjectURL(file);
            onObjectUrl(url);
            onChange(
              items.map((item) =>
                item.id === editing.id
                  ? {
                      ...item,
                      url,
                      file,
                      originalUrl: item.originalUrl ?? item.url,
                      cropped: true,
                      cropPosition,
                    }
                  : item,
              ),
            );
            setEditingId(null);
          }}
        />
      )}
    </section>
  );
}
