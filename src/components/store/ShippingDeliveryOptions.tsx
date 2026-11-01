"use client";

import { shippingDeliveryLabel, type ShippingDeliveryType } from "@/lib/shipping";

export function ShippingDeliveryOptions({ value, onChange }: {
  value: ShippingDeliveryType;
  onChange: (deliveryType: ShippingDeliveryType) => void;
}) {
  return <div role="group" aria-label="Tipo de entrega" className="flex gap-2">
    {(["D", "S"] as const).map((deliveryType) => (
      <button key={deliveryType} type="button" aria-pressed={value === deliveryType}
        onClick={() => onChange(deliveryType)}
        className={`flex-1 border px-3 py-2 text-xs transition-colors sm:text-sm ${value === deliveryType
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-background hover:border-primary"}`}>
        {shippingDeliveryLabel(deliveryType)}
      </button>
    ))}
  </div>;
}
