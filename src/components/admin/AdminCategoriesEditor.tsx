"use client";

import { Plus } from "lucide-react";
import { useContent } from "@/components/providers/ContentProvider";
import { Switch } from "@/components/ui/switch";
import type { StoreCategory } from "@/lib/content";

export function AdminCategoriesEditor({ value, onChange }: {
  value: StoreCategory[];
  onChange: (value: StoreCategory[]) => void;
}) {
  const products = useContent("products");
  const homeCards = useContent("texts").homeCategoryCards;
  const counts = new Map<string, number>();
  products.forEach((product) => counts.set(product.categoryId ?? "", (counts.get(product.categoryId ?? "") ?? 0) + 1));

  function update(id: string, patch: Partial<StoreCategory>) {
    onChange(value.map((category) => category.id === id ? { ...category, ...patch } : category));
  }

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">Ocultar una categoría también oculta todos sus productos en la tienda, sin borrarlos.</p>
      <button type="button" onClick={() => onChange([...value, { id: crypto.randomUUID(), name: "", hidden: false }])} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
        <Plus className="h-4 w-4" /> Nueva categoría
      </button>
    </div>
    <div className="overflow-hidden rounded-2xl border bg-card/30">
      {value.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">Todavía no hay categorías. Creá la primera para organizar tus productos.</p> : <>
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-secondary/40 text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Nombre</th>
                <th scope="col" className="px-4 py-3 font-medium">Productos asignados</th>
                <th scope="col" className="px-4 py-3 font-medium">Visible en tienda</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {value.map((category) => {
                const count = counts.get(category.id) ?? 0;
                const usedOnHome = homeCards.some((card) => card.categoryId === category.id);
                return <tr key={category.id} className="hover:bg-secondary/25">
                  <td className="px-4 py-3">
                    <input value={category.name} onChange={(event) => update(category.id, { name: event.target.value })} placeholder="Ej. Vestidos" maxLength={100} aria-label={`Nombre de ${category.name || "nueva categoría"}`} className="min-h-11 w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground" />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{count} {count === 1 ? "producto" : "productos"}{usedOnHome && " · En inicio"}</td>
                  <td className="px-4 py-3"><Switch checked={!category.hidden} onCheckedChange={(checked) => update(category.id, { hidden: !checked })} aria-label={`${category.hidden ? "Mostrar" : "Ocultar"} ${category.name || "categoría"} en la tienda`} /></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
        <div className="space-y-3 p-3 lg:hidden">
          {value.map((category) => {
            const count = counts.get(category.id) ?? 0;
            const usedOnHome = homeCards.some((card) => card.categoryId === category.id);
            return <article key={category.id} className="space-y-3 rounded-xl border bg-background p-4">
              <label className="block text-xs font-medium text-muted-foreground">Nombre
                <input value={category.name} onChange={(event) => update(category.id, { name: event.target.value })} placeholder="Ej. Vestidos" maxLength={100} className="mt-2 min-h-11 w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground" />
              </label>
              <label className="flex items-center justify-between gap-3 text-sm">Visible en tienda
                <Switch checked={!category.hidden} onCheckedChange={(checked) => update(category.id, { hidden: !checked })} aria-label={`${category.hidden ? "Mostrar" : "Ocultar"} ${category.name || "categoría"} en la tienda`} />
              </label>
              <p className="text-xs text-muted-foreground">{count} {count === 1 ? "producto asignado" : "productos asignados"}{usedOnHome && " · En inicio"}</p>
            </article>;
          })}
        </div>
      </>}
    </div>
  </div>;
}
