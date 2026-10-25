"use client";

import { Plus, Trash2 } from "lucide-react";
import { CollapsibleCard } from "@/components/admin/AdminEditorFields";
import type { Product } from "@/lib/products";

type PaymentPrice = NonNullable<Product["paymentPrices"]>[number];

export function ProductPaymentPricesEditor({
  prices,
  basePrice,
  onChange,
}: {
  prices: PaymentPrice[];
  basePrice: number;
  onChange: (prices: PaymentPrice[]) => void;
}) {
  function update(index: number, patch: Partial<PaymentPrice>) {
    onChange(prices.map((price, current) => (current === index ? { ...price, ...patch } : price)));
  }

  return (
    <div className="mt-4 border-t pt-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Precios por forma de pago</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Elegí los medios y el precio que querés mostrar para esta prenda.
          </p>
        </div>
        <button
          type="button"
          disabled={prices.length >= 20}
          onClick={() => onChange([...prices, { label: "Transferencia", price: basePrice }])}
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
                  onClick={() => onChange(prices.filter((_, current) => current !== index))}
                  aria-label={`Quitar precio de ${price.label || "medio de pago"}`}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-red-500/15 text-red-300 hover:bg-red-500/25"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              }
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <input
                    value={price.label}
                    maxLength={80}
                    onChange={(event) => update(index, { label: event.target.value })}
                    placeholder="Medio de pago (transferencia, efectivo…)"
                    aria-label="Medio de pago"
                    className="min-h-11 w-full border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={price.price}
                    onChange={(event) => update(index, { price: Number(event.target.value) || 0 })}
                    placeholder="Precio ($)"
                    aria-label="Precio ($)"
                    className="min-h-11 w-full border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            </CollapsibleCard>
          ))}
        </div>
      )}
    </div>
  );
}
