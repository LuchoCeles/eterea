"use client";

import { useEffect, useState } from "react";
import { requestShippingQuote, validPostalCode, type ShippingDeliveryType, type ShippingQuote } from "@/lib/shipping";

type QuoteState = { key: string; loading: boolean; quote?: ShippingQuote; error?: string };

export function useShippingQuote(postalCode: string, quantity: number, deliveryType: ShippingDeliveryType) {
  const [state, setState] = useState<QuoteState>({ key: "", loading: false });
  const [attempt, setAttempt] = useState(0);
  const key = `${postalCode}:${quantity}:${deliveryType}`;

  useEffect(() => {
    if (!validPostalCode(postalCode) || quantity < 1) return;
    const controller = new AbortController();
    setState({ key, loading: true });
    requestShippingQuote(postalCode, quantity, deliveryType, controller.signal)
      .then((quote) => {
        if (controller.signal.aborted) return;
        setState({ key, loading: false, quote });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({ key, loading: false, error: error instanceof Error ? error.message : "No pudimos calcular el envío." });
      });
    return () => controller.abort();
  }, [key, postalCode, quantity, deliveryType, attempt]);

  useEffect(() => {
    if (state.key !== key || !state.quote) return;
    const quote = state.quote;
    function expireQuote() {
      if (Date.parse(quote.expiresAt) > Date.now()) return;
      setState((current) => current.key === key && current.quote === quote
        ? { key, loading: false, error: "El precio del envío venció. Volvé a calcularlo." }
        : current);
    }
    const timer = setTimeout(expireQuote, Math.max(0, Date.parse(quote.expiresAt) - Date.now()));
    window.addEventListener("focus", expireQuote);
    document.addEventListener("visibilitychange", expireQuote);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", expireQuote);
      document.removeEventListener("visibilitychange", expireQuote);
    };
  }, [key, state]);

  return {
    loading: validPostalCode(postalCode) && quantity > 0 && (state.key !== key || state.loading),
    quote: state.key === key && !state.loading && state.quote &&
      Date.parse(state.quote.expiresAt) > Date.now() ? state.quote : undefined,
    error: state.key === key ? state.error : undefined,
    retry: () => { setState({ key, loading: true }); setAttempt((current) => current + 1); },
  };
}
