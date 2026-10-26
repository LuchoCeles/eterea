"use client";

import { useId, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Category = { id: string; name: string; hidden?: boolean };

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-AR");
}

export function ProductCategorySelect({ categories, value, onChange }: {
  categories: Category[];
  value: string;
  onChange: (category: Category) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const labelId = useId();
  const valueId = useId();
  const selected = categories.find((category) => category.id === value);
  const search = normalizeSearch(query.trim());
  const matches = categories.filter((category) => normalizeSearch(category.name).includes(search));

  return (
    <div className="min-w-0 space-y-2">
      <span id={labelId} className="block text-xs font-medium text-muted-foreground">Categoría</span>
      <Popover open={open} onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setQuery("");
      }}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-labelledby={`${labelId} ${valueId}`}
            className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2 text-left text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span id={valueId} className={selected ? "truncate" : "truncate text-muted-foreground"}>
              {selected ? `${selected.name}${selected.hidden ? " (oculta)" : ""}` : "Elegí una categoría"}
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" sideOffset={6} className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command shouldFilter={false}>
            <CommandInput value={query} onValueChange={setQuery} placeholder="Buscar categoría…" aria-label="Buscar categoría" />
            <CommandList className="max-h-56">
              <CommandEmpty>No encontramos categorías con ese nombre.</CommandEmpty>
              <CommandGroup>
                {matches.map((category) => (
                  <CommandItem
                    key={category.id}
                    value={category.id}
                    onSelect={() => {
                      onChange(category);
                      setOpen(false);
                      setQuery("");
                    }}
                    className="min-h-10 cursor-pointer"
                  >
                    <span className="min-w-0 flex-1 truncate">{category.name}</span>
                    {category.hidden && <span className="text-xs text-muted-foreground">Oculta</span>}
                    <Check className={`ml-1 h-4 w-4 shrink-0 ${category.id === value ? "opacity-100" : "opacity-0"}`} aria-hidden="true" />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
