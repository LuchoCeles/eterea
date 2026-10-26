"use client";

import { Plus, Trash2 } from "lucide-react";

const MAX_OPTIONS = 30;

export function ProductOptionsEditor({ label, singular, items, onChange }: {
  label: string;
  singular: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <section className="space-y-3 rounded-xl border bg-card/30 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium">{label}</h3>
          <p className="mt-1 text-xs text-muted-foreground">Aparecen en la ficha del producto.</p>
        </div>
        <button type="button" disabled={items.length >= MAX_OPTIONS} onClick={() => onChange([...items, ""])} className="inline-flex min-h-9 items-center gap-1 rounded-lg border px-3 text-xs hover:bg-secondary disabled:opacity-40">
          <Plus className="h-3.5 w-3.5" /> Agregar
        </button>
      </div>
      {items.length ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {items.map((item, index) => (
            <div key={index} className="flex gap-2">
              <input
                value={item}
                maxLength={80}
                placeholder={`${singular} ${index + 1}`}
                aria-label={`${singular} ${index + 1}`}
                onChange={(event) => onChange(items.map((value, current) => current === index ? event.target.value : value))}
                onBlur={(event) => {
                  if (event.relatedTarget === event.currentTarget.nextElementSibling) return;
                  if (!item.trim()) onChange(items.filter((_, current) => current !== index));
                  else if (item !== item.trim()) onChange(items.map((value, current) => current === index ? value.trim() : value));
                }}
                className="min-h-10 min-w-0 flex-1 border bg-background px-3 text-sm"
              />
              <button type="button" onClick={() => onChange(items.filter((_, current) => current !== index))} aria-label={`Quitar ${singular.toLocaleLowerCase("es-AR")} ${index + 1}`} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      ) : <p className="text-xs text-muted-foreground">Sin {label.toLocaleLowerCase("es-AR")} cargados.</p>}
    </section>
  );
}
