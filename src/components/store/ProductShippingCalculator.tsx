"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Truck } from "lucide-react";
import { useCart } from "@/components/providers/CartProvider";
import { useFreeShippingThreshold } from "@/components/providers/ShippingPolicyProvider";
import { useShippingQuote } from "@/components/store/useShippingQuote";
import { formatPrice, type Product } from "@/lib/products";
import { validPostalCode } from "@/lib/shipping";

export function ProductShippingCalculator({ product }: { product: Product }) {
  const { shippingPostalCode, setShippingPostalCode } = useCart();
  const freeShippingThreshold = useFreeShippingThreshold();
  const lowestPrice = Math.min(product.price, ...(product.paymentPrices ?? []).map((price) => price.price));
  const alwaysFree = freeShippingThreshold !== null && lowestPrice >= freeShippingThreshold;
  const [draft, setDraft] = useState(shippingPostalCode);
  const [postalCode, setPostalCode] = useState(shippingPostalCode);
  const [validationError, setValidationError] = useState("");
  const { quote, loading, error, retry } = useShippingQuote(postalCode, 1);

  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = draft.trim();
    if (!validPostalCode(value)) {
      setValidationError("Ingresá un código postal de 4 números.");
      return;
    }
    setValidationError("");
    setPostalCode(value);
    setShippingPostalCode(value);
    if (postalCode === value) retry();
  }

  const showResult = draft.trim() === postalCode;
  return (
    <div className="mt-6 border-y py-5">
      <div className="flex items-center gap-2 text-sm font-medium"><Truck className="h-4 w-4" /> Envío por Correo Argentino</div>
      <p className="mt-1 text-xs text-muted-foreground">Calculá el envío a domicilio con tu código postal.</p>
      {freeShippingThreshold !== null && <p className="mt-1 text-xs font-medium text-accent">Envío gratis desde {formatPrice(freeShippingThreshold)} en prendas.</p>}
      <form onSubmit={calculate} className="mt-3 flex gap-2">
        <input aria-label="Código postal para calcular el envío" inputMode="numeric" autoComplete="off" maxLength={4}
          value={draft} onChange={(event) => { setDraft(event.target.value.replace(/\D/g, "")); setValidationError(""); }}
          placeholder="Tu código postal" className="min-w-0 flex-1 border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
        <button type="submit" disabled={loading && draft === postalCode} className="bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-60">Calcular</button>
      </form>
      <Link href="https://www.correoargentino.com.ar/formularios/cpa" target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">
        No sé mi código postal
      </Link>
      <p role="status" className="mt-2 min-h-5 text-xs" aria-live="polite">
        {validationError || (showResult && (loading ? "Calculando envío…" : error || (quote && (alwaysFree
          ? `${quote.service} a domicilio: envío gratis con esta prenda.`
          : `${quote.service} a domicilio: ${formatPrice(quote.price)} estimados.`))))}
      </p>
    </div>
  );
}
