"use client";

import { useEffect, useState } from "react";
import { requestShippingQuote, validPostalCode, type ShippingQuote } from "@/lib/shipping";

type QuoteState = { key: string; loading: boolean; quote?: ShippingQuote; error?: string };

export function useShippingQuote(postalCode: string, quantity: number) {
  const [state, setState] = useState<QuoteState>({ key: "", loading: false });
  const [attempt, setAttempt] = useState(0);
  const key = `${postalCode}:${quantity}`;

  useEffect(() => {
    if (!validPostalCode(postalCode) || quantity < 1) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    setState({ key, loading: true });
    requestShippingQuote(postalCode, quantity, controller.signal)
      .then((quote) => {
        if (controller.signal.aborted) return;
        setState({ key, loading: false, quote });
        timer = setTimeout(() => setAttempt((current) => current + 1),
          Math.max(30_000, Date.parse(quote.expiresAt) - Date.now()));
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({ key, loading: false, error: error instanceof Error ? error.message : "No pudimos calcular el envío." });
      });
    return () => { controller.abort(); clearTimeout(timer); };
  }, [key, postalCode, quantity, attempt]);

  return {
    loading: state.key === key && state.loading,
    quote: state.key === key && !state.loading ? state.quote : undefined,
    error: state.key === key ? state.error : undefined,
    retry: () => { setState({ key, loading: true }); setAttempt((current) => current + 1); },
  };
}
