"use client";

import { useState, type UIEvent } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { ProductEditorModal } from "@/components/admin/ProductEditorModal";
import { ProductImage } from "@/components/store/ProductImage";
import { useContent } from "@/components/providers/ContentProvider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import type { StoreProduct } from "@/lib/content";
import { createProductDraft } from "@/lib/product-draft";
import { formatPrice, sortProductsByCreation } from "@/lib/products";

const PRODUCTS_PER_BATCH = 50;

export function AdminProductsEditor({
  value,
  onChange,
  onSave,
}: {
  value: StoreProduct[];
  onChange: (value: StoreProduct[]) => void;
  onSave: (value: StoreProduct[], uploadedUrls: string[]) => Promise<boolean>;
}) {
  const categories = useContent("categories");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_BATCH);
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);
  const normalizedSearch = search.trim().toLocaleLowerCase("es-AR");
  const rows = sortProductsByCreation(value).filter((product) =>
    `${product.name} ${product.category}`.toLocaleLowerCase("es-AR").includes(normalizedSearch),
  );
  const visibleRows = rows.slice(0, visibleCount);

  function handleSearchChange(nextSearch: string) {
    setSearch(nextSearch);
    setVisibleCount(PRODUCTS_PER_BATCH);
  }

  function loadMoreOnScroll(event: UIEvent<HTMLDivElement>) {
    const container = event.currentTarget;
    const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;

    if (distanceToBottom < 180) {
      setVisibleCount((current) => Math.min(current + PRODUCTS_PER_BATCH, rows.length));
    }
  }

  function update(id: string, patch: Partial<StoreProduct>) {
    onChange(value.map((product) => (product.id === id ? { ...product, ...patch } : product)));
  }

  function add() {
    setEditingProduct(createProductDraft(categories[0]));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {value.length} productos · Los más recientes aparecen primero. Administrá las categorías
          en «Categorías».
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => add()}
            disabled={categories.length === 0}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Agregar producto
          </button>
        </div>
      </div>

      {categories.length === 0 && (
        <p className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
          Creá una categoría en «Categorías» antes de agregar productos.
        </p>
      )}
      <label className="admin-product-search-field flex h-11 max-w-sm items-center gap-3 rounded-md border bg-background px-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(event) => handleSearchChange(event.target.value)}
          placeholder="Buscar productos…"
          aria-label="Buscar productos"
          className="admin-product-search min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
      </label>

      <div className="overflow-hidden rounded-2xl border bg-card/30">
        <div
          onScroll={loadMoreOnScroll}
          className="no-scrollbar hidden max-h-[70vh] overflow-auto lg:block"
        >
          <table className="w-full min-w-[940px] text-left text-sm">
            <thead className="sticky top-0 z-10 border-b bg-secondary/95 text-xs text-muted-foreground backdrop-blur">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Producto
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Categoría
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Precio
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Sección
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Creado
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Producto activo
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {visibleRows.map((product) => (
                <tr key={product.id} className="hover:bg-secondary/25">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <ProductThumbnail product={product} />
                      <div className="min-w-0">
                        <span className="block max-w-[220px] truncate font-medium">{product.name}</span>
                        <ProductAvailability product={product} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {product.category || "Sin asignar"}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{formatPrice(product.price)}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {product.section === "sale" ? "Ofertas" : product.section === "nuevo" ? "Lo nuevo" : "Sin sección"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatCreatedAt(product.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Switch
                      checked={!product.hidden}
                      onCheckedChange={(checked) => update(product.id, { hidden: !checked })}
                      aria-label={`${product.hidden ? "Mostrar" : "Ocultar"} ${product.name} en la tienda`}
                    />
                    {categories.find((category) => category.id === product.categoryId)?.hidden && (
                      <span className="ml-2 text-xs text-muted-foreground">Categoría oculta</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <RowActions
                      product={product}
                      onEdit={() => setEditingProduct(product)}
                      onDelete={() => onChange(value.filter((item) => item.id !== product.id))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div
          onScroll={loadMoreOnScroll}
          className="no-scrollbar max-h-[70vh] divide-y overflow-y-auto lg:hidden"
        >
          {visibleRows.map((product) => (
            <div key={product.id} className="flex items-center gap-3 p-3 sm:p-4">
              <ProductThumbnail product={product} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{product.name}</p>
                <ProductAvailability product={product} />
                <p className="truncate text-xs text-muted-foreground">
                  {product.category || "Sin asignar"} · {formatPrice(product.price)}
                </p>
                {categories.find((category) => category.id === product.categoryId)?.hidden && (
                  <p className="text-xs text-muted-foreground">Categoría oculta</p>
                )}
              </div>
              <Switch
                checked={!product.hidden}
                onCheckedChange={(checked) => update(product.id, { hidden: !checked })}
                aria-label={`${product.hidden ? "Mostrar" : "Ocultar"} ${product.name} en la tienda`}
              />
              <RowActions
                product={product}
                onEdit={() => setEditingProduct(product)}
                onDelete={() => onChange(value.filter((item) => item.id !== product.id))}
              />
            </div>
          ))}
        </div>
        {rows.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">
            {normalizedSearch
              ? "No hay productos que coincidan con la búsqueda."
              : "Todavía no hay productos."}
          </p>
        )}
      </div>
      {rows.length > 0 && (
        <p aria-live="polite" className="text-center text-xs text-muted-foreground">
          {visibleRows.length < rows.length
            ? `Mostrando ${visibleRows.length} de ${rows.length} productos · Desplazate hacia abajo para cargar más.`
            : `Se muestran los ${rows.length} productos.`}
        </p>
      )}

      {editingProduct && (
        <ProductEditorModal
          key={editingProduct.id}
          initial={editingProduct}
          isNew={!value.some((item) => item.id === editingProduct.id)}
          categories={categories}
          onClose={() => setEditingProduct(null)}
          onSave={(product, urls) =>
            onSave(
              value.some((item) => item.id === product.id)
                ? value.map((item) => (item.id === product.id ? product : item))
                : [product, ...value],
              urls,
            )
          }
        />
      )}
    </div>
  );
}

function ProductThumbnail({ product }: { product: StoreProduct }) {
  return (
    <ProductImage
      src={product.image}
      alt=""
      sizes="48px"
      className="h-12 w-12 shrink-0 rounded-lg object-cover"
    />
  );
}

function ProductAvailability({ product }: { product: StoreProduct }) {
  const soldOutCount = product.soldOutColors?.length ?? 0;
  if (!product.soldOut && soldOutCount === 0) return null;
  return (
    <span className="text-xs text-muted-foreground">
      {product.soldOut
        ? "Agotado"
        : `${soldOutCount} ${soldOutCount === 1 ? "color agotado" : "colores agotados"}`}
    </span>
  );
}

function RowActions({
  product,
  onEdit,
  onDelete,
}: {
  product: StoreProduct;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex justify-end gap-1">
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Editar ${product.name}`}
        className="grid h-10 w-10 place-items-center rounded-lg hover:bg-secondary"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            type="button"
            aria-label={`Eliminar ${product.name}`}
            className="grid h-10 w-10 place-items-center rounded-lg text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {product.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Se quitará del borrador. Tocá «Guardar cambios» para confirmar el borrado y limpiar
              sus fotos. Si está vinculado a banners u otras secciones, primero tendrás que
              desvincularlo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>Quitar producto</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function formatCreatedAt(value?: string) {
  if (!value) return "Anterior";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}
