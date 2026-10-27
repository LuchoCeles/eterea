"use client";

import { Switch } from "@/components/ui/switch";
import type { HomeSections } from "@/lib/content";

const sectionLabels: { key: keyof HomeSections; label: string }[] = [
  { key: "promoBar", label: "Barra de promociones" },
  { key: "hero", label: "Banners principales" },
  { key: "categories", label: "Categorías destacadas" },
  { key: "newArrivals", label: "Lo nuevo" },
  { key: "offerBanners", label: "Banners de ofertas" },
  { key: "sale", label: "Descuentos" },
  { key: "instagram", label: "Instagram" },
  { key: "newsletter", label: "Invitación a seguir a Etérea" },
];

export function HomeSectionVisibility({
  value,
  onChange,
}: {
  value: HomeSections;
  onChange: (value: HomeSections) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {sectionLabels.map(({ key, label }) => (
        <label
          key={key}
          className="flex items-center justify-between gap-4 rounded-xl border bg-secondary/30 p-4 text-sm"
        >
          <span>{label}</span>
          <Switch
            checked={value[key]}
            onCheckedChange={(checked) => onChange({ ...value, [key]: checked })}
            aria-label={`Mostrar ${label.toLocaleLowerCase("es-AR")}`}
          />
        </label>
      ))}
    </div>
  );
}
