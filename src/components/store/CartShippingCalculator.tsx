"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ShippingDeliveryOptions } from "@/components/store/ShippingDeliveryOptions";
import { validPostalCode, type ShippingDeliveryType } from "@/lib/shipping";

export function CartShippingCalculator({ postalCode, onPostalCodeChange, deliveryType, onDeliveryTypeChange,
  onEditing, loading, error, retry }: {
  postalCode: string;
  onPostalCodeChange: (value: string) => void;
  deliveryType: ShippingDeliveryType;
  onDeliveryTypeChange: (deliveryType: ShippingDeliveryType) => void;
  onEditing: (editing: boolean) => void;
  loading: boolean;
  error?: string;
  retry: () => void;
}) {
  const [draft, setDraft] = useState(postalCode);
  const [validationError, setValidationError] = useState("");
  useEffect(() => setDraft(postalCode), [postalCode]);

  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = draft.trim();
    if (!validPostalCode(value)) {
      setValidationError("Ingresá un código postal de 4 números.");
      return;
    }
    setValidationError("");
    onEditing(false);
    onPostalCodeChange(value);
    if (value === postalCode) retry();
  }

  const showResult = draft === postalCode;
  return <div>
    <p className="text-sm font-medium">Medios de envío</p>
    <div className="mt-2"><ShippingDeliveryOptions value={deliveryType} onChange={onDeliveryTypeChange} /></div>
    {deliveryType === "S" && <p className="mt-2 text-xs text-muted-foreground">La sucursal se coordina al confirmar el pedido por WhatsApp.</p>}
    <form onSubmit={calculate} className="mt-2 flex">
      <input aria-label="Código postal del envío" inputMode="numeric" autoComplete="off" maxLength={4}
        value={draft} onChange={(event) => { setDraft(event.target.value.replace(/\D/g, "")); setValidationError(""); onEditing(true); }}
        placeholder="Tu código postal" className="min-w-0 flex-1 border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
      <button type="submit" disabled={loading && draft === postalCode} className="border border-l-0 border-input bg-background px-4 py-2.5 text-sm hover:bg-card disabled:opacity-60">Calcular</button>
    </form>
    <Link href="https://www.correoargentino.com.ar/formularios/cpa" target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs underline underline-offset-4 hover:text-foreground">
      No sé mi código postal
    </Link>
    <p role="status" aria-live="polite" className="mt-1 min-h-5 text-xs text-muted-foreground">
      {validationError || (showResult && (loading ? "Calculando envío…" : error))}
    </p>
  </div>;
}
