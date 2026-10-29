"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { CollapsibleCard } from "@/components/admin/AdminEditorFields";
import { calculateDiscountedPrice, rebasePaymentPrices } from "@/lib/payment-prices";
import type { Product } from "@/lib/products";

type PaymentPrice = NonNullable<Product["paymentPrices"]>[number];
type PriceMode = "manual" | "discount";
type PriceReference = "base" | "previous";
type PriceEntry = { mode: PriceMode; percent: string };

export function ProductPaymentPricesEditor({
  prices,
  basePrice,
  oldPrice,
  onChange,
}: {
  prices: PaymentPrice[];
  basePrice: number;
  oldPrice?: number;
  onChange: (prices: PaymentPrice[]) => void;
}) {
  const hasPreviousPrice =
    typeof oldPrice === "number" && Number.isFinite(oldPrice) && oldPrice > 0 && basePrice > 0;
  const [priceReference, setPriceReference] = useState<PriceReference>(() =>
    hasPreviousPrice && (prices.length === 0 ||
      (!prices.some((price) => price.price === basePrice) &&
        prices.some((price) => price.price === oldPrice)))
      ? "previous" : "base",
  );
  const activeReference = priceReference === "previous" && hasPreviousPrice ? "previous" : "base";
  const referencePrice = activeReference === "previous" && hasPreviousPrice ? oldPrice : basePrice;
  const [entries, setEntries] = useState<PriceEntry[]>(() =>
    prices.map(() => ({ mode: "manual", percent: "" })),
  );
  const previousReferencePrice = useRef(referencePrice);

  useEffect(() => {
    if (previousReferencePrice.current === referencePrice) return;
    const updated = rebasePaymentPrices(
      prices, previousReferencePrice.current, referencePrice,
      entries.map((entry) => entry.mode === "discount" && entry.percent !== "" ? Number(entry.percent) : null),
    );
    previousReferencePrice.current = referencePrice;
    if (updated.some((price, index) => price.price !== prices[index].price)) onChange(updated);
  }, [referencePrice, entries, onChange, prices]);

  function changeReference(next: PriceReference) {
    if (next === activeReference) return;
    const nextReference = next === "previous" && hasPreviousPrice ? oldPrice : basePrice;
    const updated = rebasePaymentPrices(
      prices, referencePrice, nextReference,
      entries.map((entry) => entry.mode === "discount" && entry.percent !== "" ? Number(entry.percent) : null),
    );
    previousReferencePrice.current = nextReference;
    setPriceReference(next);
    onChange(updated);
  }

  function update(index: number, patch: Partial<PaymentPrice>) {
    onChange(prices.map((price, current) => (current === index ? { ...price, ...patch } : price)));
  }

  function changeMode(index: number, mode: PriceMode) {
    const entry = entries[index];
    setEntries(
      entries.map((current, position) => (position === index ? { ...current, mode } : current)),
    );
    if (mode === "discount" && entry && entry.percent !== "") {
      update(index, { price: calculateDiscountedPrice(referencePrice, Number(entry.percent)) });
    }
  }

  function changePercent(index: number, percent: string) {
    const numericPercent = Number(percent);
    if (
      percent !== "" &&
      (!Number.isFinite(numericPercent) || numericPercent < 0 || numericPercent > 100)
    )
      return;
    setEntries(
      entries.map((entry, position) => (position === index ? { ...entry, percent } : entry)),
    );
    if (percent !== "")
      update(index, { price: calculateDiscountedPrice(referencePrice, numericPercent) });
  }

  function addPrice() {
    setEntries([...entries, { mode: "manual", percent: "" }]);
    onChange([...prices, { label: "Transferencia", price: referencePrice }]);
  }

  function removePrice(index: number) {
    setEntries(entries.filter((_, current) => current !== index));
    onChange(prices.filter((_, current) => current !== index));
  }

  return (
    <div className="mt-4 border-t pt-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Precios por forma de pago</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Ingresá el precio directamente o calculalo con un descuento sobre el precio elegido.
            Al cambiar la referencia, se ajustan todos los medios conservando su descuento.
          </p>
          {hasPreviousPrice ? (
            <label className="mt-3 flex min-w-0 flex-col gap-1 text-xs font-medium text-muted-foreground">
              Precio de referencia para las formas de pago
              <select
                value={activeReference}
                onChange={(event) => changeReference(event.target.value as PriceReference)}
                className="min-h-11 w-full border bg-background px-3 py-2 text-sm font-normal text-foreground"
              >
                <option value="previous">Precio anterior (${oldPrice.toLocaleString("es-AR")})</option>
                <option value="base">Precio base (${basePrice.toLocaleString("es-AR")})</option>
              </select>
            </label>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              Los descuentos se calculan sobre el precio base.
            </p>
          )}
        </div>
        <button
          type="button"
          disabled={prices.length >= 20}
          onClick={addPrice}
          className="flex items-center gap-1 rounded-xl border bg-secondary/50 px-3 py-2 text-xs hover:bg-secondary disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" /> Agregar medio
        </button>
      </div>
      {prices.length > 0 && (
        <div className="mt-3 space-y-2">
          {prices.map((price, index) => (
            <CollapsibleCard
              key={index}
              title={price.label || `Medio de pago ${index + 1}`}
              summary={`$${price.price.toLocaleString("es-AR")}`}
              right={
                <button
                  type="button"
                  onClick={() => removePrice(index)}
                  aria-label={`Quitar precio de ${price.label || "medio de pago"}`}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-red-500/15 text-red-300 hover:bg-red-500/25"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              }
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-muted-foreground">
                  Medio de pago
                  <input
                    value={price.label}
                    maxLength={80}
                    onChange={(event) => update(index, { label: event.target.value })}
                    placeholder="Transferencia, efectivo…"
                    className="min-h-11 w-full border bg-background px-3 py-2 text-sm font-normal text-foreground placeholder:text-muted-foreground"
                  />
                </label>
                <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-muted-foreground">
                  Cómo definir el precio
                  <select
                    value={entries[index]?.mode ?? "manual"}
                    onChange={(event) => changeMode(index, event.target.value as PriceMode)}
                    className="min-h-11 w-full border bg-background px-3 py-2 text-sm font-normal text-foreground"
                  >
                    <option value="manual">Ingresar precio</option>
                    <option value="discount">Calcular descuento (%)</option>
                  </select>
                </label>
                {entries[index]?.mode === "discount" && (
                  <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-muted-foreground">
                    Descuento sobre el precio de referencia (%)
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={entries[index].percent}
                      onChange={(event) => changePercent(index, event.target.value)}
                      placeholder="Ej. 20"
                      className="min-h-11 w-full border bg-background px-3 py-2 text-sm font-normal text-foreground placeholder:text-muted-foreground"
                    />
                  </label>
                )}
                <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-muted-foreground">
                  {entries[index]?.mode === "discount" ? "Precio final ($)" : "Precio ($)"}
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={price.price}
                    onChange={(event) => update(index, { price: Number(event.target.value) || 0 })}
                    placeholder="Precio ($)"
                    className="min-h-11 w-full border bg-background px-3 py-2 text-sm font-normal text-foreground placeholder:text-muted-foreground"
                  />
                </label>
              </div>
              {entries[index]?.mode === "discount" && (
                <p className="mt-2 text-xs text-muted-foreground">
                  El descuento calcula el precio final. Podés editarlo para redondearlo antes de
                  guardar.
                </p>
              )}
            </CollapsibleCard>
          ))}
        </div>
      )}
    </div>
  );
}
