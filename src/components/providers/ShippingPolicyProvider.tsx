"use client";

import { createContext, useContext, type ReactNode } from "react";

const ShippingPolicyContext = createContext({ configured: false, threshold: null as number | null });

export function ShippingPolicyProvider({ configured, threshold, children }: {
  configured: boolean; threshold: number | null; children: ReactNode;
}) {
  return <ShippingPolicyContext.Provider value={{ configured, threshold }}>{children}</ShippingPolicyContext.Provider>;
}

export function useFreeShippingThreshold() {
  return useContext(ShippingPolicyContext).threshold;
}

export function useShippingConfigured() {
  return useContext(ShippingPolicyContext).configured;
}
