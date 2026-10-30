"use client";

import { useEffect, useState } from "react";

export function useProductEditorBaseline(productId: string, initialSnapshot: string): string {
  const [baseline, setBaseline] = useState(initialSnapshot);

  useEffect(() => {
    const key = `eterea-admin-product-original:${productId}`;
    try {
      window.localStorage.setItem(key, initialSnapshot);
      setBaseline(window.localStorage.getItem(key) ?? initialSnapshot);
    } catch {
      setBaseline(initialSnapshot);
    }
    return () => {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // El almacenamiento local puede dejar de estar disponible durante la edición.
      }
    };
  }, [productId, initialSnapshot]);

  return baseline;
}
