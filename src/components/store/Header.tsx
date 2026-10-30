"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { ShoppingBag, Menu, ArrowUpRight, MessageCircle, Minus, Plus, Trash2, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet";
import { formatPrice, type CartItem } from "@/lib/products";
import { ProductImage } from "@/components/store/ProductImage";
import { normalizeWhatsAppNumber } from "@/lib/storefront-rules";
import { availableCartPayments, cartCheckout } from "@/lib/cart-checkout";
import type { HomeSections } from "@/lib/content";

const links: { label: string; href: string; section?: keyof HomeSections }[] = [
  { label: "Lo nuevo", href: "/#nuevo", section: "newArrivals" },
  { label: "Prendas", href: "/productos" },
  { label: "Quiénes somos", href: "/quienes-somos" },
  { label: "Instagram", href: "/#instagram", section: "instagram" },
];

function scrollToSection(section: HTMLElement) {
  const startY = window.scrollY;
  const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const targetY = Math.min(maxY, Math.max(0, startY + section.getBoundingClientRect().top));
  const distance = targetY - startY;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || Math.abs(distance) < 2) {
    window.scrollTo(window.scrollX, targetY);
    return () => {};
  }

  const duration = Math.min(2200, Math.max(1100, Math.abs(distance) * 0.45));
  let frame = 0;
  let startedAt: number | undefined;

  function cancelAnimation() {
    window.cancelAnimationFrame(frame);
    window.removeEventListener("wheel", cancelAnimation);
    window.removeEventListener("touchstart", cancelAnimation);
    window.removeEventListener("pointerdown", cancelAnimation);
    window.removeEventListener("keydown", cancelAnimation);
  }

  function animate(now: number) {
    startedAt ??= now;
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = (1 - Math.cos(Math.PI * progress)) / 2;
    window.scrollTo(window.scrollX, startY + distance * eased);

    if (progress < 1) frame = window.requestAnimationFrame(animate);
    else cancelAnimation();
  }

  window.addEventListener("wheel", cancelAnimation, { passive: true });
  window.addEventListener("touchstart", cancelAnimation, { passive: true });
  window.addEventListener("pointerdown", cancelAnimation);
  window.addEventListener("keydown", cancelAnimation);
  frame = window.requestAnimationFrame(animate);
  return cancelAnimation;
}

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
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartAnimationKey, setCartAnimationKey] = useState(0);
  const [sectionRequest, setSectionRequest] = useState(0);
  const [selectedPaymentKey, setSelectedPaymentKey] = useState("");
  const previousCartAddCount = useRef(cartAddCount);
  const menuTitleRef = useRef<HTMLHeadingElement>(null);
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

  useEffect(() => {
    if (pathname !== "/" || !window.location.hash) return;

    const sectionId = window.location.hash.slice(1);
    if (!["nuevo", "instagram", "descuentos"].includes(sectionId)) return;
    let observer: MutationObserver | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let cancelAnimation: (() => void) | undefined;

    function tryScrollToSection() {
      const section = document.getElementById(sectionId);
      if (!section) return false;

      cancelAnimation = scrollToSection(section);
      return true;
    }

    if (!tryScrollToSection()) {
      observer = new MutationObserver(() => {
        if (tryScrollToSection()) {
          observer?.disconnect();
          clearTimeout(timeout);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      timeout = setTimeout(() => observer?.disconnect(), 15000);
    }

    return () => {
      observer?.disconnect();
      clearTimeout(timeout);
      cancelAnimation?.();
    };
  }, [pathname, sectionRequest]);

  function handleCartAnimationEnd() {
    if (hasPendingCartAnimation.current) {
      hasPendingCartAnimation.current = false;
      setCartAnimationKey((current) => current + 1);
      return;
    }

    isCartAnimating.current = false;
  }

  function handleSectionLinkClick(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    setMenuOpen(false);
    if (!href.startsWith("/#") || pathname !== "/") return;

    event.preventDefault();
    if (window.location.hash !== href.slice(1)) window.history.pushState(null, "", href);
    setSectionRequest((current) => current + 1);
  }

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const paymentOptions = availableCartPayments(cartItems);
  const selectedPayment = paymentOptions.find((option) => option.key === selectedPaymentKey) ?? paymentOptions[0];
  const hasPaymentPrices = cartItems.some((item) => item.paymentPrices?.length);
  const noCommonPayment = hasPaymentPrices && paymentOptions.length === 0;
  const checkout = cartCheckout(cartItems, selectedPayment);
  const phone = normalizeWhatsAppNumber(whatsappNumber);
  const checkoutUrl = phone && cartItems.length && !noCommonPayment
    ? "https://wa.me/" + phone + "?text=" + encodeURIComponent(checkout.message)
    : null;

  return (
    <header className="border-b bg-background">
      <div className="relative mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 md:h-[72px] md:px-8">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild><Button variant="ghost" size="icon" aria-label="Abrir menú" className="h-9 w-9"><Menu /></Button></SheetTrigger>
          <SheetContent
            side="left"
            className="w-[85%] sm:max-w-sm"
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              menuTitleRef.current?.focus();
            }}
          >
            <SheetTitle ref={menuTitleRef} tabIndex={-1} className="mt-8 font-display text-3xl outline-none">Etérea</SheetTitle>
            <SheetDescription>New Concept</SheetDescription>
            <nav className="mt-12 flex flex-col">
              {[...links.filter((link) => !link.section || homeSections[link.section]), ...(hasSale ? [{ label: "Descuentos", href: "/#descuentos" }] : [])].map((link) => (
                <Link key={link.label} href={link.href} scroll={!link.href.startsWith("/#")} onClick={(event) => handleSectionLinkClick(event, link.href)} className="group flex items-center justify-between border-b py-5 font-display text-2xl transition-colors duration-200 hover:text-accent focus-visible:text-accent motion-reduce:transition-none">{link.label}<ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-focus-visible:-translate-y-0.5 group-focus-visible:translate-x-0.5 motion-reduce:transition-none" /></Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        <Link href="/" aria-label="Etérea inicio" className="absolute left-1/2 flex min-h-11 -translate-x-1/2 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          <img src="/assets/eterea-header-logo.svg" alt="" width={1280} height={640} className="h-auto w-20 object-contain sm:w-[120px] md:w-[132px]" />
        </Link>
        <div className="ml-auto flex items-center justify-end gap-1">
          <Link href="/productos" className="mr-1 hidden text-[11px] hover:text-accent sm:inline sm:mr-2 sm:text-sm">Ver prendas</Link>
          {isAdmin && <Button asChild variant="outline" className="mr-1 inline-flex h-8 rounded-none px-2 text-xs sm:mr-3 sm:h-9 sm:px-3 sm:text-sm"><Link href="/admin"><LayoutDashboard className="mr-1 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />Admin</Link></Button>}
          <Sheet>
            <SheetTrigger asChild><Button variant="ghost" size="icon" aria-label={`Carrito, ${cartCount} prendas`} className="relative h-9 w-9">
            <ShoppingBag key={cartAnimationKey} onAnimationEnd={handleCartAnimationEnd} className={`h-5 w-5 ${cartAnimationKey > 0 ? "animate-cart-bounce" : ""}`} />
            <span className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
              {cartCount}
            </span>
            </Button></SheetTrigger>
            <SheetContent className="flex h-dvh flex-col overflow-hidden">
              <SheetTitle className="mt-8 font-display text-3xl">Tu carrito</SheetTitle>
              <SheetDescription className="mt-4">
                {cartCount ? cartCount + " " + (cartCount === 1 ? "prenda seleccionada." : "prendas seleccionadas.") : "Todavía no agregaste prendas."}
                {cartItems.length > 0 && !phone ? " El checkout por WhatsApp todavía no está configurado." : ""}
              </SheetDescription>
              {cartItems.length > 0 && (
                <div className="mt-6 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
                  {checkout.lines.map(({ item, unitPrice, discounted, total: lineTotal }) => (
                    <div key={item.lineKey} className="flex gap-3 border-b pb-4">
                      <ProductImage src={item.image} alt="" sizes="64px" className="h-20 w-16 object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{item.name}</p>
                        {(item.size || item.color) && <p className="mt-1 text-xs text-muted-foreground">{[item.size && `Talle ${item.size}`, item.color && `Color ${item.color}`].filter(Boolean).join(" · ")}</p>}
                        <p className="mt-1 text-xs text-muted-foreground">{formatPrice(unitPrice)} c/u</p>
                        <div className="mt-2 flex items-center gap-2">
                          <button type="button" onClick={() => onQuantityChange(item.lineKey, item.quantity - 1)} aria-label={"Quitar una unidad de " + item.name} className="grid h-7 w-7 place-items-center border hover:bg-card"><Minus className="h-3 w-3" /></button>
                          <span className="min-w-4 text-center text-xs">{item.quantity}</span>
                          <button type="button" onClick={() => onQuantityChange(item.lineKey, item.quantity + 1)} aria-label={"Agregar una unidad de " + item.name} className="grid h-7 w-7 place-items-center border hover:bg-card"><Plus className="h-3 w-3" /></button>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end justify-between text-right tabular-nums">
                        <div>
                          {discounted && <p className="text-xs text-muted-foreground line-through">{formatPrice(item.price * item.quantity)}</p>}
                          <p className={discounted ? "mt-0.5 text-base font-semibold text-accent" : "text-sm"}>{formatPrice(lineTotal)}</p>
                        </div>
                        <button type="button" onClick={() => onRemove(item.lineKey)} aria-label={"Quitar " + item.name + " del carrito"} className="text-muted-foreground hover:text-foreground"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-auto shrink-0 border-t bg-background pt-5">
                <div className="mb-4 h-44 max-h-[30dvh] overflow-y-auto pr-1">
                  {cartItems.length > 0 && <div className="space-y-3">
                  {paymentOptions.length > 1 && <div>
                    <p id="cart-payment-label" className="text-sm font-medium">Medio de pago</p>
                    <Select value={selectedPayment.key} onValueChange={setSelectedPaymentKey}>
                      <SelectTrigger aria-labelledby="cart-payment-label" className="mt-2 h-11 rounded-none border-input bg-background text-foreground shadow-none hover:border-primary focus:ring-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent side="bottom" className="z-[60] rounded-none border-border bg-background">
                        {paymentOptions.map((option) => <SelectItem key={option.key} value={option.key} className="rounded-none focus:bg-secondary focus:text-foreground">{option.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>}
                  {paymentOptions.length === 1 && <p className="text-sm">Medio de pago: <span className="font-medium">{selectedPayment.label}</span></p>}
                  {checkout.discount > 0 && <>
                    <p className="flex justify-between text-sm text-muted-foreground"><span>Subtotal</span><span>{formatPrice(checkout.baseTotal)}</span></p>
                    <p className="flex justify-between text-sm text-accent"><span>Descuento</span><span>−{formatPrice(checkout.discount)}</span></p>
                  </>}
                  <p className="flex justify-between font-medium"><span>Total a pagar</span><span>{formatPrice(checkout.total)}</span></p>
                  {noCommonPayment && <p className="text-xs text-accent">No hay un medio de pago disponible para todas las prendas. Revisá el carrito para continuar.</p>}
                  </div>}
                </div>
                {checkoutUrl ? (
                  <SheetClose asChild>
                    <Button asChild className="h-11 w-full shrink-0 rounded-none">
                      <a href={checkoutUrl} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /> Continuar por WhatsApp</a>
                    </Button>
                  </SheetClose>
                ) : (
                  <Button disabled className="h-11 w-full shrink-0 rounded-none">
                    <MessageCircle className="h-4 w-4" /> {noCommonPayment ? "Sin medio de pago en común" : cartItems.length ? "WhatsApp sin configurar" : "Agregá prendas para continuar"}
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
