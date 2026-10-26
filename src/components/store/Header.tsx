"use client";

import { useEffect, useRef, useState } from "react";
import { ShoppingBag, Menu, ArrowUpRight, MessageCircle, Minus, Plus, Trash2, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet";
import { formatPrice, type CartItem } from "@/lib/products";
import { ProductImage } from "@/components/store/ProductImage";
import { normalizeWhatsAppNumber } from "@/lib/storefront-rules";
import type { HomeSections } from "@/lib/content";

const logo = "/assets/eterea-placeholder.svg";

const links: { label: string; href: string; section?: keyof HomeSections }[] = [
  { label: "Lo nuevo", href: "/#nuevo", section: "newArrivals" },
  { label: "Prendas", href: "/productos" },
  { label: "New Concept", href: "/#new-concept", section: "editorial" },
  { label: "Instagram", href: "/#instagram", section: "instagram" },
];

export function Header({
  cartItems,
  cartAddCount,
  whatsappNumber,
  onQuantityChange,
  onRemove,
  homeSections,
  hasSale = false,
  isAdmin,
}: {
  cartItems: CartItem[];
  cartAddCount: number;
  whatsappNumber: string;
  onQuantityChange: (lineKey: string, quantity: number) => void;
  onRemove: (lineKey: string) => void;
  homeSections: HomeSections;
  hasSale?: boolean;
  isAdmin: boolean;
}) {
  const [cartAnimationKey, setCartAnimationKey] = useState(0);
  const previousCartAddCount = useRef(cartAddCount);
  const isCartAnimating = useRef(false);
  const hasPendingCartAnimation = useRef(false);

  useEffect(() => {
    if (cartAddCount === previousCartAddCount.current) return;
    previousCartAddCount.current = cartAddCount;

    if (isCartAnimating.current) {
      hasPendingCartAnimation.current = true;
      return;
    }

    isCartAnimating.current = true;
    setCartAnimationKey((current) => current + 1);
  }, [cartAddCount]);

  function handleCartAnimationEnd() {
    if (hasPendingCartAnimation.current) {
      hasPendingCartAnimation.current = false;
      setCartAnimationKey((current) => current + 1);
      return;
    }

    isCartAnimating.current = false;
  }

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const total = cartItems.reduce((amount, item) => amount + item.price * item.quantity, 0);
  const hasPaymentPrices = cartItems.some((item) => item.paymentPrices?.length);
  const phone = normalizeWhatsAppNumber(whatsappNumber);
  const message = [
    "Hola, quiero comprar estas prendas de Etérea:",
    "",
    ...cartItems.map((item) => "• " + item.name + " (" + [item.category, item.size && `talle ${item.size}`, item.color && `color ${item.color}`].filter(Boolean).join(", ") + ") — " + item.quantity + " × " + formatPrice(item.price) + " = " + formatPrice(item.price * item.quantity)),
    "",
    (hasPaymentPrices ? "Subtotal al precio base: " : "Total: ") + formatPrice(total),
    ...(hasPaymentPrices ? ["El importe final depende de la forma de pago."] : []),
  ].join("\n");
  const checkoutUrl = phone && cartItems.length
    ? "https://wa.me/" + phone + "?text=" + encodeURIComponent(message)
    : null;

  return (
    <header className="border-b bg-background">
      <div className="mx-auto grid h-24 max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center px-4 md:px-8">
        <Sheet>
          <SheetTrigger asChild><Button variant="ghost" size="icon" aria-label="Abrir menú" className="h-11 w-11"><Menu /></Button></SheetTrigger>
          <SheetContent side="left" className="w-[85%] sm:max-w-sm">
            <SheetTitle className="mt-8 font-display text-3xl">Etérea</SheetTitle>
            <SheetDescription>New Concept</SheetDescription>
            <nav className="mt-12 flex flex-col">
              {[...links.filter((link) => !link.section || homeSections[link.section]), ...(hasSale ? [{ label: "Descuentos", href: "/#descuentos" }] : [])].map((link) => (
                <SheetClose asChild key={link.label}><a href={link.href} className="flex items-center justify-between border-b py-5 font-display text-2xl">{link.label}<ArrowUpRight className="h-4 w-4" /></a></SheetClose>
              ))}
              {isAdmin && <SheetClose asChild><Link href="/admin" className="flex items-center justify-between border-b py-5 font-display text-2xl">Administración<LayoutDashboard className="h-4 w-4" /></Link></SheetClose>}
            </nav>
          </SheetContent>
        </Sheet>
        <Link href="/" aria-label="Etérea inicio" className="block">
          <img src={logo} alt="Etérea New Concept" className="h-[72px] w-[144px] object-contain md:h-20 md:w-[180px]" />
        </Link>
        <div className="flex items-center justify-end">
          <Link href="/productos" className="mr-3 hidden text-sm hover:text-accent sm:inline">Ver prendas</Link>
          {isAdmin && <Button asChild variant="outline" className="mr-3 hidden h-9 rounded-none px-3 sm:inline-flex"><Link href="/admin"><LayoutDashboard className="mr-2 h-4 w-4" />Admin</Link></Button>}
          <Sheet>
            <SheetTrigger asChild><Button variant="ghost" size="icon" aria-label={`Carrito, ${cartCount} prendas`} className="relative h-11 w-11">
            <ShoppingBag key={cartAnimationKey} onAnimationEnd={handleCartAnimationEnd} className={`h-5 w-5 ${cartAnimationKey > 0 ? "animate-cart-bounce" : ""}`} />
            <span className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
              {cartCount}
            </span>
            </Button></SheetTrigger>
            <SheetContent className="flex flex-col overflow-y-auto">
              <SheetTitle className="mt-8 font-display text-3xl">Tu carrito</SheetTitle>
              <SheetDescription className="mt-4">
                {cartCount ? cartCount + " " + (cartCount === 1 ? "prenda seleccionada." : "prendas seleccionadas.") : "Todavía no agregaste prendas."}
                {cartItems.length > 0 && !phone ? " El checkout por WhatsApp todavía no está configurado." : ""}
              </SheetDescription>
              {cartItems.length > 0 && (
                <div className="mt-6 max-h-[50vh] space-y-4 overflow-y-auto pr-1">
                  {cartItems.map((item) => (
                    <div key={item.lineKey} className="flex gap-3 border-b pb-4">
                      <ProductImage src={item.image} alt="" sizes="64px" className="h-20 w-16 object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{item.name}</p>
                        {(item.size || item.color) && <p className="mt-1 text-xs text-muted-foreground">{[item.size && `Talle ${item.size}`, item.color && `Color ${item.color}`].filter(Boolean).join(" · ")}</p>}
                        <p className="mt-1 text-xs text-muted-foreground">{formatPrice(item.price)} c/u</p>
                        <div className="mt-2 flex items-center gap-2">
                          <button type="button" onClick={() => onQuantityChange(item.lineKey, item.quantity - 1)} aria-label={"Quitar una unidad de " + item.name} className="grid h-7 w-7 place-items-center border hover:bg-card"><Minus className="h-3 w-3" /></button>
                          <span className="min-w-4 text-center text-xs">{item.quantity}</span>
                          <button type="button" onClick={() => onQuantityChange(item.lineKey, item.quantity + 1)} aria-label={"Agregar una unidad de " + item.name} className="grid h-7 w-7 place-items-center border hover:bg-card"><Plus className="h-3 w-3" /></button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <p className="text-sm">{formatPrice(item.price * item.quantity)}</p>
                        <button type="button" onClick={() => onRemove(item.lineKey)} aria-label={"Quitar " + item.name + " del carrito"} className="text-muted-foreground hover:text-foreground"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-auto border-t pt-5">
                {cartItems.length > 0 && <div className="mb-4"><p className="flex justify-between font-medium"><span>{hasPaymentPrices ? "Subtotal al precio base" : "Total"}</span><span>{formatPrice(total)}</span></p>{hasPaymentPrices && <p className="mt-2 text-xs text-muted-foreground">El importe final depende de la forma de pago.</p>}</div>}
                {checkoutUrl ? (
                  <SheetClose asChild>
                    <Button asChild className="w-full rounded-none">
                      <a href={checkoutUrl} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /> Continuar por WhatsApp</a>
                    </Button>
                  </SheetClose>
                ) : (
                  <Button disabled className="w-full rounded-none">
                    <MessageCircle className="h-4 w-4" /> {cartItems.length ? "WhatsApp sin configurar" : "Agregá prendas para continuar"}
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
