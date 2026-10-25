"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { CartItem, Product } from "@/lib/products";

type CartContextValue = {
  items: CartItem[];
  addAnimationKey: number;
  add: (product: Product) => void;
  changeQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [addAnimationKey, setAddAnimationKey] = useState(0);
  const value: CartContextValue = {
    items,
    addAnimationKey,
    add: (product) => {
      setItems((current) => {
        const existing = current.find((item) => item.id === product.id);
        return existing
          ? current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
          : [...current, { ...product, quantity: 1 }];
      });
      setAddAnimationKey((current) => current + 1);
    },
    changeQuantity: (productId, quantity) => setItems((current) => (
      quantity < 1
        ? current.filter((item) => item.id !== productId)
        : current.map((item) => item.id === productId ? { ...item, quantity } : item)
    )),
    remove: (productId) => setItems((current) => current.filter((item) => item.id !== productId)),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart debe usarse dentro de CartProvider.");
  return context;
}
