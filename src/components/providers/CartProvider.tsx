"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { CartItem, Product } from "@/lib/products";

type CartContextValue = {
  items: CartItem[];
  addAnimationKey: number;
  add: (product: Product, selection?: { size?: string; color?: string }) => void;
  changeQuantity: (lineKey: string, quantity: number) => void;
  remove: (lineKey: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [addAnimationKey, setAddAnimationKey] = useState(0);
  const value: CartContextValue = {
    items,
    addAnimationKey,
    add: (product, selection) => {
      const colors = product.colors ?? [];
      const sizes = product.sizes ?? [];
      if (product.soldOut || (colors.length > 0 && colors.every((color) => product.soldOutColors?.includes(color)))) return;
      if (sizes.length > 0 && (!selection?.size || !sizes.includes(selection.size))) return;
      if (colors.length > 0 && (!selection?.color || !colors.includes(selection.color) || product.soldOutColors?.includes(selection.color))) return;
      const lineKey = JSON.stringify([product.id, selection?.size ?? "", selection?.color ?? ""]);
      setItems((current) => {
        const existing = current.find((item) => item.lineKey === lineKey);
        return existing
          ? current.map((item) => item.lineKey === lineKey ? { ...item, quantity: item.quantity + 1 } : item)
          : [...current, { ...product, ...selection, lineKey, quantity: 1 }];
      });
      setAddAnimationKey((current) => current + 1);
    },
    changeQuantity: (lineKey, quantity) => setItems((current) => (
      quantity < 1
        ? current.filter((item) => item.lineKey !== lineKey)
        : current.map((item) => item.lineKey === lineKey && !(quantity > item.quantity && (item.soldOut || (item.color && item.soldOutColors?.includes(item.color)))) ? { ...item, quantity } : item)
    )),
    remove: (lineKey) => setItems((current) => current.filter((item) => item.lineKey !== lineKey)),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart debe usarse dentro de CartProvider.");
  return context;
}
