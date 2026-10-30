"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Crop, ImagePlus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ProductImageEditor } from "@/components/admin/ProductImageEditor";
import { ProductImage } from "@/components/store/ProductImage";
import { isAlreadySixteenNine, type CropSettings, type ImageSettings } from "@/lib/image-presentation";
import { parseCloudinaryAssetUrl } from "@/lib/cloudinary-media";

export type GalleryItem = {
  id: string;
  url: string;
  file?: File;
  settings?: ImageSettings | null;
  coverSettings?: CropSettings | null;
};
export const MAX_PRODUCT_IMAGES = 5;
const IMAGE_TYPES = new Set(["image/avif", "image/gif", "image/jpeg", "image/png", "image/webp"]);
const canEdit = (item: GalleryItem) => !!item.file || !!parseCloudinaryAssetUrl(item.url, "eterea");

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
  const [editingCover, setEditingCover] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const editing = items.find((item) => item.id === editingId);

  function move(from: number, to: number) {
    if (to === 0 || from === 0) {
      void selectCover(items[to === 0 ? from : to]);
      return;
    }
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  async function selectCover(item: GalleryItem) {
    if (disabled) return;
    if (!canEdit(item)) {
      toast.error("Esta foto anterior no admite un encuadre nuevo. Subí su archivo original para editarla.");
      return;
    }
    if (item.id === items[0]?.id) {
      setEditingCover(true);
      setEditingId(item.id);
      return;
    }
    try {
      const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
        image.onerror = reject;
        image.src = item.url;
      });
      const currentItems = itemsRef.current;
      if (!currentItems.some((current) => current.id === item.id)) return;
      if (isAlreadySixteenNine(dimensions.width, dimensions.height)) {
        onChange([{ ...item, coverSettings: { ...dimensions, zoom: 1, x: 0, y: 0 } },
          ...currentItems.filter((current) => current.id !== item.id)]);
      } else {
        setEditingCover(true);
        setEditingId(item.id);
      }
    } catch {
      setEditingCover(true);
      setEditingId(item.id);
    }
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
    const next = [
      ...items,
      ...files.map((file) => {
        const url = URL.createObjectURL(file);
        onObjectUrl(url);
        return { id: crypto.randomUUID(), url, file, settings: null, coverSettings: null };
      }),
    ];
    onChange(next);
    if (!items.length && next[0]) {
      setEditingCover(true);
      setEditingId(next[0].id);
    }
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
            La primera foto será la portada. Cada foto conserva su original y su propio formato.
            Las imágenes utilizadas como portada deben tener una relación de aspecto 16:9. Podés ajustar el encuadre antes de guardar.
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
                presentation={index === 0 && item.coverSettings ? item.coverSettings : item.settings}
                cover={index === 0 && !!item.coverSettings}
                alt={`Foto ${index + 1} del producto`}
                sizes="(min-width: 640px) 33vw, 50vw"
                className={`h-full w-full ${item.file || item.settings || (index === 0 && item.coverSettings) ? "object-contain" : "object-cover"}`}
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
                onClick={() => {
                  if (!canEdit(item)) {
                    toast.error("Esta foto anterior no admite un encuadre nuevo. Subí su archivo original para editarla.");
                    return;
                  }
                  setEditingCover(false); setEditingId(item.id);
                }}
                disabled={disabled}
                className="flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border text-xs font-medium hover:bg-secondary disabled:opacity-50"
              >
                <Crop className="h-3.5 w-3.5" />
                Elegir formato y encuadre
              </button>
              {index === 0 && <button type="button" onClick={() => void selectCover(item)} disabled={disabled}
                className="flex min-h-9 w-full items-center justify-center gap-1 rounded-lg border text-xs hover:bg-secondary disabled:opacity-50">
                <Star className="h-3.5 w-3.5" /> Editar portada
              </button>}
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => void selectCover(item)}
                  disabled={disabled}
                  className="flex min-h-9 w-full items-center justify-center gap-1 rounded-lg border text-xs hover:bg-secondary disabled:opacity-50"
                >
                  <Star className="h-3.5 w-3.5" />
                  Usar como portada
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
                  onClick={() => {
                    const next = items.filter((current) => current.id !== item.id);
                    onChange(next);
                    if (index === 0 && next[0] && !next[0].coverSettings && canEdit(next[0])) {
                      setEditingCover(true);
                      setEditingId(next[0].id);
                    }
                  }}
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
          source={editing.url}
          cover={editingCover}
          initialSettings={editingCover ? editing.coverSettings : editing.settings}
          onClose={() => setEditingId(null)}
          onApply={(settings) => {
            const updated = items.map((item) => item.id === editing.id
              ? editingCover ? { ...item, coverSettings: settings as CropSettings }
                : { ...item, settings: settings as ImageSettings }
              : item);
            onChange(editingCover ? [updated.find((item) => item.id === editing.id)!, ...updated.filter((item) => item.id !== editing.id)] : updated);
            setEditingId(null);
          }}
        />
      )}
    </section>
  );
}
