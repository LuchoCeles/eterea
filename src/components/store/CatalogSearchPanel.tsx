"use client";

import { useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type FilterOption = { label: string; value: string; count: number };

export function CatalogSearchPanel({
  categoryOptions,
  sizeOptions,
  activeCategory,
  activeSize,
  onCategoryChange,
  onSizeChange,
  discountOnly,
  onDiscountChange,
  showDiscount,
  discountCount,
  sort,
  onSortChange,
  resultCount,
  activeFilterCount,
  onClear,
}: {
  categoryOptions: FilterOption[];
  sizeOptions: FilterOption[];
  activeCategory: string;
  activeSize: string;
  onCategoryChange: (value: string) => void;
  onSizeChange: (value: string) => void;
  discountOnly: boolean;
  onDiscountChange: (value: boolean) => void;
  showDiscount: boolean;
  discountCount: number;
  sort: string;
  onSortChange: (value: string) => void;
  resultCount: number;
  activeFilterCount: number;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex h-11 shrink-0 items-center justify-center gap-2 border border-primary bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-label={`Filtrar y ordenar prendas${activeFilterCount ? `, ${activeFilterCount} ${activeFilterCount === 1 ? "filtro activo" : "filtros activos"}` : ""}`}
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          <span>Filtrar y ordenar</span>
          {activeFilterCount > 0 && <span className="grid h-6 min-w-6 place-items-center rounded-full bg-primary-foreground px-1 text-xs text-primary" aria-hidden="true">{activeFilterCount}</span>}
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex h-dvh w-full max-w-none flex-col gap-0 overflow-hidden border-l p-0 sm:max-w-[460px]"
      >
        <div className="shrink-0 border-b bg-sand/40 px-5 pb-5 pt-7 sm:px-7">
          <p className="eyebrow text-muted-foreground">ETÉREA / PRENDAS</p>
          <SheetTitle className="mt-3 font-display text-3xl font-normal sm:text-4xl">Elegí tus preferencias</SheetTitle>
          <SheetDescription className="mt-2 text-sm">Filtrá y ordená las prendas a tu manera.</SheetDescription>
        </div>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 sm:px-7">
          <FilterSection
            id="sort"
            title="Ordenar por"
            initiallyExpanded
            options={[
              { label: "Más recientes", value: "recent" },
              { label: "Menor precio", value: "price-asc" },
              { label: "Mayor precio", value: "price-desc" },
            ]}
            activeValue={sort}
            onSelect={onSortChange}
          />
          {categoryOptions.length > 0 && <FilterSection id="categories" title="Categorías" options={categoryOptions} activeValue={activeCategory} onSelect={onCategoryChange} />}
          {sizeOptions.length > 0 && <FilterSection id="sizes" title="Talles" options={sizeOptions} activeValue={activeSize} onSelect={onSizeChange} />}
          {showDiscount && (
            <FilterSection
              id="discounts"
              title="Ofertas"
              options={[
                { label: "Solo ofertas", value: "discount", count: discountCount },
              ]}
              activeValue={discountOnly ? "discount" : ""}
              onSelect={(value) => onDiscountChange(value === "discount")}
            />
          )}
        </div>

        <div className="shrink-0 border-t bg-background px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClear} disabled={activeFilterCount === 0 && sort === ""} className="h-12 px-2 text-sm underline underline-offset-4 hover:text-accent disabled:cursor-not-allowed disabled:opacity-40">Limpiar</button>
            <SheetClose asChild>
              <button type="button" className="h-12 flex-1 bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">Ver {resultCount} {resultCount === 1 ? "prenda" : "prendas"}</button>
            </SheetClose>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function FilterSection({ id, title, options, activeValue, onSelect, initiallyExpanded = false }: {
  id: string;
  title: string;
  options: { label: string; value: string; count?: number }[];
  activeValue: string;
  onSelect: (value: string) => void;
  initiallyExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const sectionId = `catalog-${id}`;

  return (
    <section className="border-b">
      <button type="button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} aria-controls={sectionId} className="flex min-h-16 w-full items-center justify-between gap-3 text-left text-sm font-bold">
        <span>{title}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      <div id={sectionId} hidden={!expanded} className="no-scrollbar max-h-56 space-y-1 overflow-y-auto pb-5">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(activeValue === option.value ? "" : option.value)}
            aria-pressed={activeValue === option.value}
            className={`flex min-h-10 w-full items-center justify-between gap-3 px-3 text-left text-sm transition-colors ${activeValue === option.value ? "bg-primary text-primary-foreground" : "hover:bg-secondary/70"}`}
          >
            <span className="min-w-0 truncate">{option.label}</span>
            {option.count !== undefined && <span className={`shrink-0 text-xs ${activeValue === option.value ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{option.count}</span>}
          </button>
        ))}
      </div>
    </section>
  );
}
