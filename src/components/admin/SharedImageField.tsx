"use client";

import { useState } from "react";
import { Crop } from "lucide-react";
import { ImageField } from "@/components/admin/AdminEditorFields";
import { ProductImageEditor } from "@/components/admin/ProductImageEditor";
import { ProductImagePicker } from "@/components/admin/ProductImagePicker";
import { ProductImage } from "@/components/store/ProductImage";
import { useContent } from "@/components/providers/ContentProvider";
import { resolveImageSource } from "@/lib/image-source";
import type { CropSettings } from "@/lib/image-presentation";
import type { ImageSection } from "@/lib/media";

export function SharedImageField({ label, image, imageSettings, productId, section, cropRatio, editorTitle, editorDescription, onChange, onUploaded }: {
  label: string;
  image: string;
  imageSettings?: CropSettings | null;
  productId?: string;
  section: ImageSection;
  cropRatio: number;
  editorTitle: string;
  editorDescription: string;
  onChange: (next: { image: string; productId?: string; imageSettings?: CropSettings | null }) => void;
  onUploaded: (url: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editing, setEditing] = useState<{ source: string; image: string; productId?: string; initialSettings?: CropSettings | null } | null>(null);
  const products = useContent("products");
  const selected = products.find((product) => product.id === productId);
  const source = productId ? resolveImageSource({ productId }, products) : image;

  function applySettings(settings: CropSettings) {
    if (!editing) return;
    onChange({ image: editing.image, productId: editing.productId, imageSettings: settings });
    setEditing(null);
  }

  return (
    <div className="space-y-3 text-xs text-muted-foreground">
      <p>{label} · fuente</p>
      {productId ? (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border">
            <ProductImage src={source} alt="" presentation={imageSettings} cropRatio={cropRatio} sizes="64px" className="h-full w-full object-cover" />
          </div>
          <div className="space-y-2">
            <p className="max-w-48 leading-5">
              {selected ? `Se usa la foto de ${selected.name}. Si la cambiás en Productos, se actualiza acá.` : "Este producto ya no está disponible."}
            </p>
            {selected && <button type="button" onClick={() => setEditing({ source, image: "", productId, initialSettings: imageSettings })}
              className="flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-sm text-foreground hover:bg-secondary">
              <Crop className="h-4 w-4" /> Ajustar posición
            </button>}
          </div>
        </div>
      ) : (
        <ImageField label="Foto propia" value={image} imageSettings={imageSettings} section={section} cropRatio={cropRatio}
          editorTitle={editorTitle} editorDescription={editorDescription} onUploaded={onUploaded}
          onChange={({ image: next, settings }) => onChange({ image: next, imageSettings: settings })} />
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setPickerOpen(true)} className="min-h-11 rounded-lg border px-3 py-2 text-sm text-foreground hover:bg-secondary">
          {productId ? "Cambiar producto" : "Elegir foto de producto"}
        </button>
        {productId && <button type="button" onClick={() => image
          ? setEditing({ source: image, image, initialSettings: null })
          : onChange({ image: "", imageSettings: null })}
          className="min-h-11 rounded-lg border px-3 py-2 text-sm text-foreground hover:bg-secondary">Usar foto propia</button>}
      </div>
      {pickerOpen && <ProductImagePicker
        open={pickerOpen}
        products={products}
        selectedId={productId}
        onClose={() => setPickerOpen(false)}
        onSelect={(id) => {
          const product = products.find((item) => item.id === id);
          if (!product) return;
          setEditing({ source: resolveImageSource({ productId: id }, products), image: "", productId: id });
        }}
      />}
      {editing && <ProductImageEditor
        key={editing.source}
        source={editing.source}
        initialSettings={editing.initialSettings}
        cropRatio={cropRatio}
        title={editorTitle}
        description={editorDescription}
        onClose={() => setEditing(null)}
        onApply={(settings) => applySettings(settings as CropSettings)}
      />}
    </div>
  );
}
