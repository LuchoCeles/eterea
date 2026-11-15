"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ShippingDeliveryType } from "@/lib/shipping";

const ShippingPolicyContext = createContext({ configured: false, threshold: null as number | null,
  homeDeliveryEnabled: true, branchDeliveryEnabled: true });

export function ShippingPolicyProvider({ configured, threshold, homeDeliveryEnabled, branchDeliveryEnabled, children }: {
  configured: boolean; threshold: number | null; homeDeliveryEnabled: boolean;
  branchDeliveryEnabled: boolean; children: ReactNode;
}) {
  return <ShippingPolicyContext.Provider value={{ configured, threshold, homeDeliveryEnabled,
    branchDeliveryEnabled }}>{children}</ShippingPolicyContext.Provider>;
}

export function useFreeShippingThreshold() {
  return useContext(ShippingPolicyContext).threshold;
}

export function useShippingConfigured() {
  return useContext(ShippingPolicyContext).configured;
}

export function useShippingDeliveryTypes(): ShippingDeliveryType[] {
  const { homeDeliveryEnabled, branchDeliveryEnabled } = useContext(ShippingPolicyContext);
  return [homeDeliveryEnabled ? "D" : null, branchDeliveryEnabled ? "S" : null]
    .filter((value): value is ShippingDeliveryType => value !== null);
}
