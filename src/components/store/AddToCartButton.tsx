"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/products";

export function AddToCartButton({
  product,
  onAdd,
  className,
}: {
  product: Product;
  onAdd: (product: Product) => void;
  className?: string;
}) {
  const [added, setAdded] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  function handleAdd() {
    onAdd(product);
    setAdded(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setAdded(false);
      timeoutRef.current = null;
    }, 1000);
  }

  return (
    <Button
      type="button"
      onClick={handleAdd}
      aria-live="polite"
      className={`${className ?? ""} transition-all active:scale-[0.97] ${added ? "bg-accent text-accent-foreground" : ""}`}
    >
      {added ? <Check className="h-4 w-4 animate-in zoom-in-50 duration-200" /> : <Plus className="h-4 w-4" />}
      {added ? "Agregado" : "Agregar al carrito"}
    </Button>
  );
}
