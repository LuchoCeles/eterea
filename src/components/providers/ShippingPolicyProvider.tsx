"use client";

import { createContext, useContext, type ReactNode } from "react";

const ShippingPolicyContext = createContext<number | null>(null);

export function ShippingPolicyProvider({ threshold, children }: { threshold: number | null; children: ReactNode }) {
  return <ShippingPolicyContext.Provider value={threshold}>{children}</ShippingPolicyContext.Provider>;
}

export function useFreeShippingThreshold() {
  return useContext(ShippingPolicyContext);
}
