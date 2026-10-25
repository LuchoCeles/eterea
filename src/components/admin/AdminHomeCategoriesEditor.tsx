"use client";

import { Fragment, useState } from "react";
import { ChevronRight, ImageIcon, Plus, Search, Trash2 } from "lucide-react";
import { useList } from "@/components/admin/AdminEditorFields";
import { SharedImageField } from "@/components/admin/SharedImageField";
import { useContent } from "@/components/providers/ContentProvider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { resolveImageSource } from "@/lib/image-source";
import type { HomeCategoryCard } from "@/lib/content";

export function AdminHomeCategoriesEditor({
  value,
  onChange,
  onUploaded,
}: {
  value: HomeCategoryCard[];
  onChange: (value: HomeCategoryCard[]) => void;
  onUploaded: (url: string) => void;
}) {
  const categories = useContent("categories");
  const products = useContent("products");
  const list = useList(value, onChange);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const unusedCategories = categories.filter(
    (category) => !value.some((card) => card.categoryId === category.id),
  );
  const searchTerm = categorySearch.trim().toLocaleLowerCase("es-AR");
  const matchingCategories = unusedCategories.filter((category) =>
    category.name.toLocaleLowerCase("es-AR").includes(searchTerm),
  );

  function changeCategoryPicker(next: boolean) {
    setShowCategoryPicker(next);
    if (!next) setCategorySearch("");
  }

  function addCategory(categoryId: string) {
    list.add({ id: crypto.randomUUID(), categoryId, img: "", hidden: false });
    changeCategoryPicker(false);
  }

  function removeCategory(index: number, card: HomeCategoryCard, name: string) {
    if (
      !window.confirm(
        `¿Eliminar «${name}» de las categorías destacadas? La categoría del catálogo seguirá disponible.`,
      )
    )
      return;
    if (editingImageId === card.id) setEditingImageId(null);
    list.remove(index);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-muted-foreground">
        Elegí qué categorías destacar, ordenalas y cambiá la foto de cada una. En el inicio solo
        aparecen las que están visibles y tienen productos.
      </p>
      {unusedCategories.length > 0 && (
        <Dialog open={showCategoryPicker} onOpenChange={changeCategoryPicker}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 text-sm font-medium text-foreground hover:bg-primary/10"
            >
              <Plus className="h-4 w-4" /> Agregar una categoría
            </button>
          </DialogTrigger>
          <DialogContent className="flex max-h-[85dvh] w-[calc(100%-2rem)] max-w-md flex-col gap-0 overflow-hidden rounded-[24px] p-0 shadow-2xl">
            <DialogHeader className="border-b bg-secondary/30 px-5 pb-5 pt-6 text-left sm:px-6">
              <span className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Plus className="h-5 w-5" aria-hidden="true" />
              </span>
              <DialogTitle>Agregar una categoría</DialogTitle>
              <DialogDescription>
                Elegí una categoría del catálogo para destacarla en el inicio.
              </DialogDescription>
            </DialogHeader>
            <div className="px-5 pb-3 pt-5 sm:px-6">
              <label className="flex min-h-11 items-center gap-3 rounded-xl border bg-background px-3 focus-within:ring-2 focus-within:ring-ring">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <input
                  autoFocus
                  type="search"
                  value={categorySearch}
                  onChange={(event) => setCategorySearch(event.target.value)}
                  placeholder="Buscar categoría…"
                  aria-label="Buscar categoría"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </label>
              <p className="mt-3 text-xs text-muted-foreground" aria-live="polite">
                {matchingCategories.length}{" "}
                {matchingCategories.length === 1
                  ? "categoría disponible"
                  : "categorías disponibles"}
              </p>
            </div>
            <div className="min-h-0 max-h-[min(48dvh,360px)] overflow-y-auto overscroll-contain px-5 pb-5 sm:px-6">
              {matchingCategories.length > 0 ? (
                <div
                  className="divide-y overflow-hidden rounded-xl border bg-background"
                  role="list"
                  aria-label="Categorías disponibles"
                >
                  {matchingCategories.map((category) => (
                    <div key={category.id} role="listitem">
                      <button
                        type="button"
                        onClick={() => addCategory(category.id)}
                        className="group flex min-h-16 w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                      >
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 font-semibold text-primary">
                          {category.name.trim().charAt(0).toLocaleUpperCase("es-AR")}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {category.name}
                          </span>
                          {category.hidden && (
                            <span className="block text-xs text-muted-foreground">
                              Oculta en el catálogo
                            </span>
                          )}
                        </span>
                        <ChevronRight
                          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed px-4 text-center">
                  <Search className="mb-3 h-6 w-6 text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm font-medium">No encontramos esa categoría</p>
                  <p className="mt-1 text-xs text-muted-foreground">Probá con otro nombre.</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
      <div className="overflow-x-auto rounded-2xl border bg-background/50">
        {value.length > 0 ? (
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b bg-secondary/40 text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Categoría y foto
                </th>
                <th scope="col" className="w-32 px-4 py-3 font-medium">
                  En el inicio
                </th>
                <th scope="col" className="w-28 px-4 py-3 font-medium">
                  Orden
                </th>
                <th scope="col" className="w-36 px-4 py-3 font-medium">
                  Foto
                </th>
                <th scope="col" className="w-24 px-4 py-3 font-medium">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {value.map((card, index) => {
                const category = categories.find((item) => item.id === card.categoryId);
                const categoryName = category?.name ?? "Categoría eliminada";
                const imageOpen = editingImageId === card.id;
                const imageEditorId = `home-category-image-${card.id}`;
                const availableCategories = [...(category ? [category] : []), ...unusedCategories];
                return (
                  <Fragment key={card.id}>
                    <tr className="hover:bg-secondary/20">
                      <td className="px-4 py-3 align-top">
                        <div className="flex min-w-0 items-center gap-3">
                          <img
                            src={resolveImageSource(card, products)}
                            alt=""
                            className="h-14 w-14 shrink-0 rounded-xl border object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <label className="sr-only" htmlFor={`home-category-${card.id}`}>
                              Categoría de destino
                            </label>
                            <select
                              id={`home-category-${card.id}`}
                              value={card.categoryId}
                              onChange={(event) =>
                                list.set(index, { categoryId: event.target.value })
                              }
                              className="min-h-10 w-full rounded-lg border bg-background px-2 text-sm text-foreground"
                            >
                              {!category && (
                                <option value={card.categoryId}>Categoría eliminada</option>
                              )}
                              {availableCategories.map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.name}
                                  {item.hidden ? " (oculta)" : ""}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <Switch
                          checked={!card.hidden}
                          onCheckedChange={(checked) => list.set(index, { hidden: !checked })}
                          aria-label={`${card.hidden ? "Mostrar" : "Ocultar"} ${categoryName} en el inicio`}
                        />
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <select
                          value={index + 1}
                          onChange={(event) => list.move(index, Number(event.target.value) - 1)}
                          aria-label={`Posición de ${categoryName}`}
                          className="min-h-10 w-20 rounded-lg border bg-background px-2 text-sm text-foreground"
                        >
                          {value.map((_, position) => (
                            <option key={position} value={position + 1}>
                              {position + 1}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <button
                          type="button"
                          aria-expanded={imageOpen}
                          aria-controls={imageEditorId}
                          onClick={() => setEditingImageId(imageOpen ? null : card.id)}
                          className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg border px-3 text-sm hover:bg-secondary"
                        >
                          <ImageIcon className="h-4 w-4" />{" "}
                          {imageOpen ? "Cerrar foto" : "Editar foto"}
                        </button>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <button
                          type="button"
                          onClick={() => removeCategory(index, card, categoryName)}
                          aria-label={`Eliminar ${categoryName} de las categorías destacadas`}
                          className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" /> Eliminar
                        </button>
                      </td>
                    </tr>
                    {imageOpen && (
                      <tr>
                        <td id={imageEditorId} colSpan={5} className="bg-secondary/20 px-4 py-4">
                          <SharedImageField
                            label={`Foto de ${categoryName}`}
                            image={card.img}
                            productId={card.productId}
                            section="inicio"
                            onUploaded={onUploaded}
                            onChange={({ image, productId }) =>
                              onChange(
                                value.map((item) =>
                                  item.id === card.id ? { ...item, img: image, productId } : item,
                                ),
                              )
                            }
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="p-5 text-sm text-muted-foreground">Todavía no hay categorías destacadas.</p>
        )}
      </div>
      {categories.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Creá una categoría en «Catálogo» para agregarla al inicio.
        </p>
      )}
    </div>
  );
}
