"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { CollapsibleCard } from "@/components/admin/AdminEditorFields";
import { calculateDiscountedPrice, rebasePaymentPrices } from "@/lib/payment-prices";
import type { Product } from "@/lib/products";

type PaymentPrice = NonNullable<Product["paymentPrices"]>[number];
type PriceMode = "manual" | "discount";
type PriceEntry = { mode: PriceMode; percent: string };

export function ProductPaymentPricesEditor({
  prices,
  basePrice,
  basePayment,
  onChange,
}: {
  prices: PaymentPrice[];
  basePrice: number;
  basePayment?: boolean;
  onChange: (prices: PaymentPrice[]) => void;
}) {
  const referencePrice = basePrice;
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
    if (basePayment && updated[0]) updated[0] = { ...updated[0], price: basePrice };
    previousReferencePrice.current = referencePrice;
    if (updated.some((price, index) => price.price !== prices[index].price)) onChange(updated);
  }, [referencePrice, entries, onChange, prices, basePayment, basePrice]);

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
    onChange([...prices, { label: `Medio de pago ${prices.length + 1}`, price: referencePrice }]);
  }

  function removePrice(index: number) {
    if (basePayment && index === 0) return;
    setEntries(entries.filter((_, current) => current !== index));
    onChange(prices.filter((_, current) => current !== index));
  }

  return (
    <div className="mt-4 border-t pt-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Precios por forma de pago</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Ingresá el precio directamente o calculalo con un descuento sobre el precio base.
            Al cambiar el precio base, se ajustan los demás medios conservando su descuento.
          </p>
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
              right={!(basePayment && index === 0) &&
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
                    readOnly={basePayment && index === 0}
                    onChange={(event) => update(index, { label: event.target.value })}
                    placeholder="Transferencia, efectivo…"
                    className="min-h-11 w-full border bg-background px-3 py-2 text-sm font-normal text-foreground placeholder:text-muted-foreground"
                  />
                </label>
                {!(basePayment && index === 0) && <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-muted-foreground">
                  Cómo definir el precio
                  <select
                    value={entries[index]?.mode ?? "manual"}
                    onChange={(event) => changeMode(index, event.target.value as PriceMode)}
                    className="min-h-11 w-full border bg-background px-3 py-2 text-sm font-normal text-foreground"
                  >
                    <option value="manual">Ingresar precio</option>
                    <option value="discount">Calcular descuento (%)</option>
                  </select>
                </label>}
                {!(basePayment && index === 0) && entries[index]?.mode === "discount" && (
                  <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-muted-foreground">
                    Descuento sobre el precio base (%)
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
                    readOnly={basePayment && index === 0}
                    onChange={(event) => update(index, { price: Number(event.target.value) || 0 })}
                    placeholder="Precio ($)"
                    className="min-h-11 w-full border bg-background px-3 py-2 text-sm font-normal text-foreground placeholder:text-muted-foreground"
                  />
                </label>
              </div>
              {basePayment && index === 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Este importe se carga en el campo «Precio base».
                </p>
              )}
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
