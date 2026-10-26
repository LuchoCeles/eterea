"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProductImage } from "@/components/store/ProductImage";
import type { StoreProduct } from "@/lib/content";

const RESULT_LIMIT = 30;

export function ProductImagePicker({ open, products, selectedId, onClose, onSelect }: {
  open: boolean;
  products: StoreProduct[];
  selectedId?: string;
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "es-AR"));
  const term = search.trim().toLocaleLowerCase("es-AR");
  const matches = products.filter((product) =>
    (!category || product.category === category) &&
    (!term || `${product.name} ${product.category}`.toLocaleLowerCase("es-AR").includes(term)),
  );

  function close() {
    setSearch("");
    setCategory("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) close(); }}>
      <DialogContent className="flex max-h-[90dvh] max-w-2xl flex-col gap-4 overflow-hidden p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Elegir foto de producto</DialogTitle>
          <DialogDescription>Buscá por nombre o categoría y seleccioná la foto que querés usar.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-lg border bg-background px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nombre del producto…"
              aria-label="Buscar producto por nombre o categoría"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </label>
          {categories.length > 1 && (
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              aria-label="Filtrar por categoría"
              className="min-h-11 rounded-lg border bg-background px-3 text-sm text-foreground sm:max-w-48"
            >
              <option value="">Todas las categorías</option>
              {categories.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          )}
        </div>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {matches.length === 0
            ? "No hay productos que coincidan."
            : matches.length > RESULT_LIMIT
              ? `Mostrando ${RESULT_LIMIT} de ${matches.length} productos. Afiná la búsqueda para ver más.`
              : `${matches.length} ${matches.length === 1 ? "producto" : "productos"}`}
        </p>
        <div className="min-h-0 overflow-y-auto overscroll-contain rounded-xl border" role="list" aria-label="Resultados de productos">
          {matches.slice(0, RESULT_LIMIT).map((product) => (
            <div key={product.id} role="listitem" className="border-b last:border-b-0">
              <button
                type="button"
                onClick={() => { onSelect(product.id); close(); }}
                className="flex min-h-16 w-full items-center gap-3 p-2 text-left text-sm hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <ProductImage src={product.image} alt="" loading="lazy" sizes="48px" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{product.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{product.category || "Sin categoría"}</span>
                </span>
                {product.id === selectedId && <span className="shrink-0 text-xs text-primary">En uso</span>}
              </button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
