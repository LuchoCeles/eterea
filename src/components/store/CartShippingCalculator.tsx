"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ChevronDown, Trash2, Truck } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ShippingDeliveryOptions } from "@/components/store/ShippingDeliveryOptions";
import type { CartShippingSelection } from "@/lib/cart-checkout";
import { formatPrice } from "@/lib/products";
import { validPostalCode, type ShippingDeliveryType, type ShippingQuote } from "@/lib/shipping";

export function CartShippingCalculator({ postalCode, onPostalCodeChange, deliveryType, noShipping, onDeliveryTypeChange,
  editing, onEditing, results, freeShipping, loading, retry }: {
  postalCode: string;
  onPostalCodeChange: (value: string) => void;
  deliveryType: ShippingDeliveryType | null;
  noShipping: boolean;
  onDeliveryTypeChange: (deliveryType: CartShippingSelection) => void;
  editing: boolean;
  onEditing: (editing: boolean) => void;
  results: Record<ShippingDeliveryType, { loading: boolean; quote?: ShippingQuote; error?: string }>;
  freeShipping: boolean;
  loading: boolean;
  retry: () => void;
}) {
  const [draft, setDraft] = useState(postalCode);
  const [validationError, setValidationError] = useState("");
  const [open, setOpen] = useState(!deliveryType && !noShipping);
  useEffect(() => setDraft(postalCode), [postalCode]);
  useEffect(() => { if (!deliveryType && !noShipping) setOpen(true); }, [deliveryType, noShipping]);

  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = draft.trim();
    if (!validPostalCode(value)) {
      setValidationError("Ingresá un código postal de 4 números.");
      return;
    }
    setValidationError("");
    onEditing(false);
    if (value === postalCode) retry();
    else onPostalCodeChange(value);
  }

  const showResult = !editing && draft === postalCode && validPostalCode(postalCode);
  const selectedResult = deliveryType ? results[deliveryType] : undefined;
  const selectedPrice = selectedResult?.loading ? "Calculando…"
    : selectedResult?.quote ? freeShipping ? "Gratis" : formatPrice(selectedResult.quote.price)
      : "Actualizá el precio";
  const summary = editing ? "Confirmá el código postal para actualizar el envío"
    : noShipping ? "Sin envío · Solo prendas"
      : deliveryType ? `${deliveryType === "D" ? "A domicilio" : "Por sucursal"} · CP ${postalCode} · ${selectedPrice}`
      : validPostalCode(postalCode) ? `CP ${postalCode} · Elegí una opción` : "Calculá el envío a tu código postal";

  return <Collapsible open={open} onOpenChange={setOpen} className="border border-border">
    <div className="flex items-stretch">
      <CollapsibleTrigger className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3 text-left hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        <Truck className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">Opciones de envío</span>
          <span className="block text-xs text-muted-foreground">{summary}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </CollapsibleTrigger>
      {deliveryType && <button type="button" aria-label="Quitar envío" title="Quitar envío"
        onClick={() => { onDeliveryTypeChange("none"); setOpen(false); }}
        className="grid w-11 shrink-0 place-items-center border-l text-accent hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>}
    </div>
    <CollapsibleContent className="border-t px-3 pb-3">
      <form onSubmit={calculate} className="mt-3 flex">
        <input aria-label="Código postal del envío" inputMode="numeric" autoComplete="off" maxLength={4}
          value={draft} onChange={(event) => { setDraft(event.target.value.replace(/\D/g, "")); setValidationError(""); onEditing(true); }}
          placeholder="Tu código postal" className="min-w-0 flex-1 border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
        <button type="submit" disabled={loading && draft === postalCode} className="border border-l-0 border-input bg-background px-4 py-2.5 text-sm hover:bg-card disabled:opacity-60">{draft === postalCode && validPostalCode(postalCode) ? "Actualizar" : "Calcular"}</button>
      </form>
      <Link href="https://www.correoargentino.com.ar/formularios/cpa" target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs underline underline-offset-4 hover:text-foreground">
        No sé mi código postal
      </Link>
      {validationError && <p role="alert" className="mt-1 text-xs text-accent">{validationError}</p>}
      {showResult && <div className="mt-3" aria-live="polite">
        <p className="mb-2 text-xs font-medium">Elegí una opción para sumarla al total</p>
        <ShippingDeliveryOptions value={deliveryType} onChange={(value) => { onDeliveryTypeChange(value); setOpen(false); }}
          results={results} freeShipping={freeShipping} />
        {loading && <span className="sr-only">Calculando opciones de envío…</span>}
      </div>}
      {!deliveryType && !noShipping && <button type="button"
        onClick={() => { onDeliveryTypeChange("none"); setOpen(false); }}
        className="mt-3 w-full border border-transparent bg-muted/60 p-3.5 text-left text-sm hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        Continuar sin envío
      </button>}
    </CollapsibleContent>
  </Collapsible>;
}
