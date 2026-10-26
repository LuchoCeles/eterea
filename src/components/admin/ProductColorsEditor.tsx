"use client";

import { Plus, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const MAX_COLORS = 30;

export function ProductColorsEditor({
  colors,
  soldOutColors,
  onChange,
}: {
  colors: string[];
  soldOutColors: string[];
  onChange: (colors: string[], soldOutColors: string[]) => void;
}) {
  function rename(index: number, label: string) {
    const previous = colors[index];
    const next = colors.map((color, position) => position === index ? label : color);
    const unavailable = soldOutColors.includes(previous)
      ? soldOutColors.map((color) => color === previous ? label : color).filter(Boolean)
      : soldOutColors;
    onChange(next, unavailable);
  }

  function remove(index: number) {
    onChange(
      colors.filter((_, position) => position !== index),
      soldOutColors.filter((color) => color !== colors[index]),
    );
  }

  function toggle(label: string, soldOut: boolean) {
    if (!label.trim()) return;
    onChange(colors, soldOut
      ? [...soldOutColors, label]
      : soldOutColors.filter((color) => color !== label));
  }

  return (
    <section className="space-y-3 rounded-xl border bg-card/30 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium">Colores</h3>
          <p className="mt-1 text-xs text-muted-foreground">Cada color puede marcarse como agotado.</p>
        </div>
        <button
          type="button"
          disabled={colors.length >= MAX_COLORS}
          onClick={() => onChange([...colors, ""], soldOutColors)}
          className="inline-flex min-h-9 items-center gap-1 rounded-lg border px-3 text-xs hover:bg-secondary disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" /> Agregar
        </button>
      </div>
      {colors.length ? (
        <div className="space-y-2">
          {colors.map((color, index) => (
            <div key={index} className="rounded-lg border bg-background p-2">
              <div className="flex gap-2">
                <input
                  value={color}
                  maxLength={80}
                  placeholder={`Color ${index + 1}`}
                  aria-label={`Color ${index + 1}`}
                  onChange={(event) => rename(index, event.target.value)}
                  onBlur={(event) => {
                    if (event.relatedTarget === event.currentTarget.nextElementSibling) return;
                    if (!color.trim()) remove(index);
                    else if (color !== color.trim()) rename(index, color.trim());
                  }}
                  className="min-h-10 min-w-0 flex-1 border bg-background px-3 text-sm"
                />
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label={`Quitar color ${index + 1}`}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <label className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>Agotado en este color</span>
                <Switch
                  checked={soldOutColors.includes(color)}
                  onCheckedChange={(checked) => toggle(color, checked)}
                  disabled={!color.trim()}
                  aria-label={`Marcar ${color || `color ${index + 1}`} como agotado`}
                />
              </label>
            </div>
          ))}
        </div>
      ) : <p className="text-xs text-muted-foreground">Sin colores cargados.</p>}
    </section>
  );
}
