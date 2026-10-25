"use client";

import { AddButton, CollapsibleCard, ListControls, useList } from "@/components/admin/AdminEditorFields";
import { SharedImageField } from "@/components/admin/SharedImageField";
import { useContent } from "@/components/providers/ContentProvider";
import { resolveImageSource } from "@/lib/image-source";
import type { HomeCategoryCard } from "@/lib/content";
import { Switch } from "@/components/ui/switch";

export function AdminHomeCategoriesEditor({ value, onChange, onUploaded }: {
  value: HomeCategoryCard[];
  onChange: (value: HomeCategoryCard[], saveImmediately?: boolean) => void;
  onUploaded: (url: string) => void;
}) {
  const categories = useContent("categories");
  const products = useContent("products");
  const list = useList(value, onChange);
  const unusedCategories = categories.filter((category) => !value.some((card) => card.categoryId === category.id));

  return <div className="space-y-3">
    <p className="text-sm leading-6 text-muted-foreground">Elegí qué categorías destacar en el inicio, su orden y la foto de cada tarjeta. Solo se muestran categorías con productos. Los productos y los filtros se administran en «Catálogo».</p>
    {value.map((card, index) => {
      const category = categories.find((item) => item.id === card.categoryId);
      return <CollapsibleCard
        key={card.id}
        title={category?.name ?? "Categoría eliminada"}
        summary={category ? category.hidden ? "La categoría está oculta en la tienda" : card.hidden ? "Oculta en el inicio" : "Visible en el inicio" : "Elegí una categoría disponible"}
        preview={resolveImageSource(card, products)}
        right={<ListControls i={index} len={value.length} move={list.move} />}
      >
        <div className="grid gap-4 md:grid-cols-[auto_1fr]">
          <label className="flex items-center justify-between gap-3 text-sm md:col-span-2">Mostrar en el inicio
            <Switch checked={!card.hidden} onCheckedChange={(checked) => list.set(index, { hidden: !checked })} aria-label={`${card.hidden ? "Mostrar" : "Ocultar"} ${category?.name ?? "tarjeta"} en el inicio`} />
          </label>
          <SharedImageField
            label="Foto de la tarjeta"
            image={card.img}
            productId={card.productId}
            section="inicio"
            onUploaded={onUploaded}
            onChange={({ image, productId }) => onChange(value.map((item) => item.id === card.id ? { ...item, img: image, productId } : item), true)}
          />
          <label className="text-xs font-medium text-muted-foreground">Categoría de destino
            <select
              value={card.categoryId}
              onChange={(event) => list.set(index, { categoryId: event.target.value })}
              className="mt-2 min-h-11 w-full border bg-background px-3 py-2 text-sm text-foreground"
            >
              {!category && <option value={card.categoryId}>Categoría eliminada</option>}
              {[...(category ? [category] : []), ...unusedCategories].map((item) => <option key={item.id} value={item.id}>{item.name}{item.hidden ? " (oculta)" : ""}</option>)}
            </select>
          </label>
        </div>
      </CollapsibleCard>;
    })}
    {unusedCategories.length > 0 && <AddButton onClick={() => list.add({ id: crypto.randomUUID(), categoryId: unusedCategories[0].id, img: "", hidden: false })}>Agregar categoría al inicio</AddButton>}
    {categories.length === 0 && <p className="text-sm text-muted-foreground">Creá una categoría en «Catálogo» para agregar una tarjeta.</p>}
  </div>;
}
