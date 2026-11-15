"use client";

import { useShippingQuote } from "@/components/store/useShippingQuote";
import type { ShippingDeliveryType } from "@/lib/shipping";

export function useShippingQuotes(postalCode: string, quantity: number,
  availableTypes: ShippingDeliveryType[]) {
  const home = useShippingQuote(availableTypes.includes("D") ? postalCode : "", quantity, "D");
  const branch = useShippingQuote(availableTypes.includes("S") ? postalCode : "", quantity, "S");

  return {
    results: { D: home, S: branch },
    loading: availableTypes.some((type) => (type === "D" ? home : branch).loading),
    retry: () => {
      if (availableTypes.includes("D")) home.retry();
      if (availableTypes.includes("S")) branch.retry();
    },
  };
}
