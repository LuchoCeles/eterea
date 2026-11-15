"use client";

import { useId } from "react";
import { useShippingDeliveryTypes } from "@/components/providers/ShippingPolicyProvider";
import { formatPrice } from "@/lib/products";
import type { ShippingDeliveryType, ShippingQuote } from "@/lib/shipping";

type ShippingResult = { loading: boolean; quote?: ShippingQuote; error?: string };

export function ShippingDeliveryOptions({ value, onChange, results, freeShipping }: {
  value?: ShippingDeliveryType | null;
  onChange?: (deliveryType: ShippingDeliveryType) => void;
  results: Record<ShippingDeliveryType, ShippingResult>;
  freeShipping: boolean;
}) {
  const availableTypes = useShippingDeliveryTypes();
  const groupName = useId();

  return <fieldset className="space-y-2">
    <legend className="sr-only">{onChange ? "Elegir envío" : "Tarifas de envío"}</legend>
    {availableTypes.map((deliveryType) => {
      const result = results[deliveryType];
      const quote = !result.loading && result.quote;
      const selected = value === deliveryType && !!quote;
      if (result.loading) return <div key={deliveryType} role="status" aria-label={`Calculando ${deliveryType === "D" ? "envío a domicilio" : "retiro por sucursal"}`}
        className="border border-transparent bg-muted/60 p-3.5">
        <span aria-hidden="true" className="flex animate-pulse items-start gap-3 motion-reduce:animate-none">
          {onChange && <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-border" />}
          <span className="min-w-0 flex-1 space-y-2">
            <span className="block h-3 w-3/4 rounded-sm bg-border" />
            <span className="block h-2.5 w-1/2 rounded-sm bg-border" />
          </span>
          <span className="h-3 w-16 shrink-0 rounded-sm bg-border" />
        </span>
      </div>;

      const content = <span className="flex items-start gap-3">
          {onChange && quote && <span aria-hidden="true" className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${selected ? "border-primary" : "border-muted-foreground"}`}>
            {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
          </span>}
          <span className="min-w-0 flex-1">
            <span className="block text-sm leading-5">{deliveryType === "D"
              ? "Envío Clásico de Correo Argentino a domicilio" : "Retiro por sucursal de Correo Argentino"}</span>
            {result.error && <span className="mt-1 block text-xs text-muted-foreground">{result.error}</span>}
          </span>
          <span className="shrink-0 text-right text-sm font-medium">{quote
            ? freeShipping ? "Gratis" : formatPrice(quote.price) : "No disponible"}</span>
        </span>;
      if (!onChange || !quote) return <div key={deliveryType} className={`border border-transparent bg-muted/60 p-3.5 ${quote ? "" : "opacity-70"}`}>{content}</div>;
      return <label key={deliveryType} className={`block cursor-pointer border p-3.5 transition-colors focus-within:ring-2 focus-within:ring-primary ${selected
        ? "border-primary bg-sand/50" : "border-transparent bg-muted/60 hover:border-primary"}`}>
        <input type="radio" name={groupName} value={deliveryType} checked={selected}
          onChange={() => onChange(deliveryType)} className="sr-only" />
        {content}
      </label>;
    })}
  </fieldset>;
}
