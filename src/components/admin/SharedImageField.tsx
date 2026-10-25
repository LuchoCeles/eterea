"use client";

import { useState } from "react";
import { ImageField } from "@/components/admin/AdminEditorFields";
import { ProductImagePicker } from "@/components/admin/ProductImagePicker";
import { ProductImage } from "@/components/store/ProductImage";
import { useContent } from "@/components/providers/ContentProvider";
import { resolveImageSource } from "@/lib/image-source";
import type { ImageSection } from "@/lib/media";

export function SharedImageField({ label, image, productId, section, onChange, onUploaded }: {
  label: string;
  image: string;
  productId?: string;
  section: ImageSection;
  onChange: (next: { image: string; productId?: string }) => void;
  onUploaded: (url: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const products = useContent("products");
  const selected = products.find((product) => product.id === productId);

  return (
    <div className="space-y-3 text-xs text-muted-foreground">
      <p>{label} · fuente</p>
      {productId ? (
        <div className="flex items-center gap-3">
          <ProductImage src={resolveImageSource({ productId }, products)} alt="" className="h-20 w-16 rounded-xl border object-cover" />
          <p className="max-w-48 leading-5">
            {selected ? `Se usa la foto de ${selected.name}. Si la cambiás en Productos, se actualiza acá.` : "Este producto ya no está disponible."}
          </p>
        </div>
      ) : (
        <ImageField label="Foto propia" value={image} section={section} onUploaded={onUploaded} onChange={(next) => onChange({ image: next })} />
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setPickerOpen(true)} className="min-h-11 rounded-lg border px-3 py-2 text-sm text-foreground hover:bg-secondary">
          {productId ? "Cambiar producto" : "Elegir foto de producto"}
        </button>
        {productId && <button type="button" onClick={() => onChange({ image, productId: undefined })} className="min-h-11 rounded-lg border px-3 py-2 text-sm text-foreground hover:bg-secondary">Usar foto propia</button>}
      </div>
      {pickerOpen && <ProductImagePicker
        open={pickerOpen}
        products={products}
        selectedId={productId}
        onClose={() => setPickerOpen(false)}
        onSelect={(id) => onChange({ image: "", productId: id })}
      />}
    </div>
  );
}
