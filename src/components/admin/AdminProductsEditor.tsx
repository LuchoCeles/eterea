"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { BatchImageUploader } from "@/components/admin/BatchImageUploader";
import { Field, ImageField } from "@/components/admin/AdminEditorFields";
import { ProductPaymentPricesEditor } from "@/components/admin/ProductPaymentPricesEditor";
import { ProductImage } from "@/components/store/ProductImage";
import { useContent } from "@/components/providers/ContentProvider";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { StoreProduct } from "@/lib/content";
import { formatPrice, sortProductsByCreation } from "@/lib/products";
import { referencedProductIds } from "@/lib/image-source";

export function AdminProductsEditor({ value, onChange, onUploaded }: {
  value: StoreProduct[];
  onChange: (value: StoreProduct[]) => void;
  onUploaded: (urls: string[]) => void;
}) {
  const categories = useContent("categories");
  const hero = useContent("hero");
  const texts = useContent("texts");
  const instagram = useContent("instagram");
  const referencedIds = new Set(referencedProductIds({ hero, categories, texts, instagram }));
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const selected = value.find((product) => product.id === editingId);
  const normalizedSearch = search.trim().toLocaleLowerCase("es-AR");
  const rows = sortProductsByCreation(value).filter((product) =>
    `${product.name} ${product.category}`.toLocaleLowerCase("es-AR").includes(normalizedSearch),
  );

  function update(id: string, patch: Partial<StoreProduct>) {
    onChange(value.map((product) => product.id === id ? { ...product, ...patch } : product));
  }

  function remove(id: string) {
    if (referencedIds.has(id)) {
      toast.error("Este producto se usa como foto en otra sección. Quitá esa referencia antes de borrarlo.");
      return;
    }
    onChange(value.filter((product) => product.id !== id));
  }

  function add(image = "") {
    const product: StoreProduct = {
      id: crypto.randomUUID(),
      name: "Nueva prenda",
      categoryId: categories[0]?.id ?? "",
      category: categories[0]?.name ?? "",
      createdAt: new Date().toISOString(),
      price: 0,
      image,
      section: "nuevo",
    };
    onChange([product, ...value]);
    if (!image) setEditingId(product.id);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{value.length} productos · Los más recientes aparecen primero. Administrá las categorías en «Categorías».</p>
        <div className="flex flex-wrap gap-2">
          {categories.length > 0 && <BatchImageUploader section="productos" onUploaded={(urls) => {
            onUploaded(urls);
            const createdAt = Date.now();
            onChange([...urls.map((image, index) => ({
              id: crypto.randomUUID(), name: `Nueva prenda ${value.length + index + 1}`,
              categoryId: categories[0].id, category: categories[0].name,
              createdAt: new Date(createdAt + index).toISOString(),
              price: 0, image, section: "nuevo" as const,
            })), ...value]);
          }} />}
          <button type="button" onClick={() => add()} disabled={categories.length === 0} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">
            <Plus className="h-4 w-4" /> Agregar producto
          </button>
        </div>
      </div>

      {categories.length === 0 && <p className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">Creá una categoría en «Categorías» antes de agregar productos.</p>}
      <label className="flex h-11 max-w-sm items-center gap-3 rounded-md border bg-background px-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar productos…" aria-label="Buscar productos" className="admin-product-search min-w-0 flex-1 bg-transparent text-sm outline-none" />
      </label>

      <div className="overflow-hidden rounded-2xl border bg-card/30">
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b bg-secondary/40 text-xs text-muted-foreground">
              <tr><th scope="col" className="px-4 py-3 font-medium">Producto</th><th scope="col" className="px-4 py-3 font-medium">Categoría</th><th scope="col" className="px-4 py-3 font-medium">Precio</th><th scope="col" className="px-4 py-3 font-medium">Sección</th><th scope="col" className="px-4 py-3 font-medium">Creado</th><th scope="col" className="px-4 py-3 text-right font-medium">Acciones</th></tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((product) => <tr key={product.id} className="hover:bg-secondary/25">
                <td className="px-4 py-3"><div className="flex items-center gap-3"><ProductThumbnail product={product} /><span className="max-w-[220px] truncate font-medium">{product.name}</span></div></td>
                <td className="px-4 py-3 text-muted-foreground">{product.category || "Sin asignar"}</td>
                <td className="px-4 py-3 tabular-nums">{formatPrice(product.price)}</td>
                <td className="px-4 py-3 text-muted-foreground">{product.section === "sale" ? "Sale" : "Lo nuevo"}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatCreatedAt(product.createdAt)}</td>
                <td className="px-4 py-3"><RowActions product={product} onEdit={() => setEditingId(product.id)} onRemove={() => remove(product.id)} /></td>
              </tr>)}
            </tbody>
          </table>
        </div>
        <div className="divide-y lg:hidden">
          {rows.map((product) => <div key={product.id} className="flex items-center gap-3 p-3 sm:p-4">
            <ProductThumbnail product={product} />
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{product.name}</p><p className="truncate text-xs text-muted-foreground">{product.category || "Sin asignar"} · {formatPrice(product.price)}</p></div>
            <RowActions product={product} onEdit={() => setEditingId(product.id)} onRemove={() => remove(product.id)} />
          </div>)}
        </div>
        {rows.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">{search ? "No hay productos que coincidan con la búsqueda." : "Todavía no hay productos."}</p>}
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setEditingId(null); }}>
        <DialogContent className="max-h-[90dvh] max-w-3xl overflow-y-auto">
          <DialogHeader><DialogTitle>Editar producto</DialogTitle><DialogDescription>Editá los datos de la prenda.</DialogDescription></DialogHeader>
          {selected && <ProductFields product={selected} categories={categories} onChange={(patch) => update(selected.id, patch)} onUploaded={(url) => onUploaded([url])} />}
          <button type="button" onClick={() => setEditingId(null)} className="min-h-11 rounded-xl border px-4 text-sm font-medium hover:bg-secondary">Cerrar</button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductThumbnail({ product }: { product: StoreProduct }) {
  return <ProductImage src={product.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />;
}

function RowActions({ product, onEdit, onRemove }: { product: StoreProduct; onEdit: () => void; onRemove: () => void }) {
  return <div className="flex justify-end gap-1">
    <button type="button" onClick={onEdit} aria-label={`Editar ${product.name}`} className="grid h-10 w-10 place-items-center rounded-lg hover:bg-secondary"><Pencil className="h-4 w-4" /></button>
    <button type="button" onClick={onRemove} aria-label={`Borrar ${product.name}`} className="grid h-10 w-10 place-items-center rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
  </div>;
}

function ProductFields({ product, categories, onChange, onUploaded }: {
  product: StoreProduct;
  categories: { id: string; name: string }[];
  onChange: (patch: Partial<StoreProduct>) => void;
  onUploaded: (url: string) => void;
}) {
  return <div className="space-y-5">
    <ImageField label="Foto" value={product.image} section="productos" onUploaded={onUploaded} onChange={(image) => onChange({ image })} />
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Nombre" value={product.name} onChange={(name) => onChange({ name })} />
      <label className="text-xs font-medium text-muted-foreground">Categoría
        <select value={product.categoryId ?? ""} onChange={(event) => {
          const category = categories.find((item) => item.id === event.target.value);
          onChange({ categoryId: category?.id ?? "", category: category?.name ?? "" });
        }} className="mt-2 min-h-11 w-full border bg-background px-3 py-2 text-sm text-foreground">
          <option value="">Elegí una categoría</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </label>
      <label className="text-xs font-medium text-muted-foreground">Sección
        <select value={product.section} onChange={(event) => onChange({ section: event.target.value as StoreProduct["section"] })} className="mt-2 min-h-11 w-full border bg-background px-3 py-2 text-sm text-foreground">
          <option value="nuevo">Lo nuevo</option><option value="sale">Sale</option>
        </select>
      </label>
      <Field label="Precio ($)" type="number" value={product.price} onChange={(next) => onChange({ price: Number(next) || 0 })} />
      <Field label="Precio anterior ($, opcional)" type="number" value={product.oldPrice ?? ""} onChange={(next) => onChange({ oldPrice: next ? Number(next) : undefined })} />
      <Field label="Etiqueta (ej. Nuevo, -30%)" value={product.tag ?? ""} onChange={(next) => onChange({ tag: next || undefined })} />
    </div>
    <ProductPaymentPricesEditor basePrice={product.price} prices={product.paymentPrices ?? []} onChange={(paymentPrices) => onChange({ paymentPrices: paymentPrices.length ? paymentPrices : undefined })} />
  </div>;
}

function formatCreatedAt(value?: string) {
  if (!value) return "Anterior";
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}
