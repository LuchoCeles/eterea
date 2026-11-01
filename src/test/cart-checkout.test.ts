import assert from "node:assert/strict";
import { it } from "node:test";
import { availableCartPayments, cartCheckout } from "../lib/cart-checkout";
import { formatPrice, type CartItem } from "../lib/products";

const first: CartItem = {
  id: "vestido", lineKey: "vestido", name: "Vestido", category: "Vestidos", image: "",
  price: 68_900, quantity: 2,
  paymentPrices: [
    { label: "Transferencia", price: 68_900 },
    { label: "Efectivo", price: 55_120 },
  ],
};
const second: CartItem = {
  id: "blusa", lineKey: "blusa", name: "Blusa", category: "Camisas", image: "",
  price: 30_000, quantity: 1,
  paymentPrices: [
    { label: "Efectivo", price: 24_000 },
    { label: "Transferencia", price: 30_000 },
  ],
};

it("calcula el total y el mensaje con el medio elegido y el descuento aplicado", () => {
  const options = availableCartPayments([first, second]);
  assert.deepEqual(options.map((option) => option.label), ["Transferencia", "Efectivo"]);

  const checkout = cartCheckout([first, second], options[1]);
  assert.equal(checkout.baseTotal, 167_800);
  assert.equal(checkout.total, 134_240);
  assert.equal(checkout.discount, 33_560);
  assert.deepEqual(checkout.lines.map((line) => line.discounted), [true, true]);
  assert.match(checkout.message, /Medio de pago: Efectivo/);
  assert.ok(checkout.message.includes(`2 × ${formatPrice(55_120)} = ${formatPrice(110_240)}`));
  assert.ok(checkout.message.includes(`Descuento: -${formatPrice(33_560)}`));
  assert.ok(checkout.message.includes(`Total de prendas: ${formatPrice(134_240)}`));
});

it("ofrece medios comunes y usa el precio base de prendas sin precios por medio", () => {
  const legacy = { ...second, paymentPrices: undefined };
  const options = availableCartPayments([first, legacy]);
  assert.deepEqual(options.map((option) => option.label), ["Transferencia", "Efectivo"]);
  assert.equal(cartCheckout([first, legacy], options[1]).total, 140_240);
  assert.deepEqual(availableCartPayments([legacy]), []);
  assert.deepEqual(availableCartPayments([first, { ...second, paymentPrices: [{ label: "Tarjeta", price: 30_000 }] }]), []);
});

it("usa automáticamente el único medio disponible sin inventar descuentos", () => {
  const options = availableCartPayments([first, {
    ...second, paymentPrices: [{ label: "Transferencia", price: 30_000 }],
  }]);
  assert.deepEqual(options.map((option) => option.label), ["Transferencia"]);
  const checkout = cartCheckout([first], options[0]);
  assert.equal(checkout.total, 137_800);
  assert.equal(checkout.discount, 0);
  assert.equal(checkout.lines[0].discounted, false);
  assert.ok(checkout.message.includes("Medio de pago: Transferencia"));
  assert.ok(checkout.message.includes(`Total de prendas: ${formatPrice(137_800)}`));
  assert.ok(!checkout.message.includes("Descuento:"));
});

it("suma la cotización al carrito y al mensaje sin aplicar descuentos al envío", () => {
  const shipping = { postalCode: "1414", quantity: 3, price: 5240.5,
    service: "Correo Argentino Clásico", expiresAt: new Date(Date.now() + 60_000).toISOString() };
  const checkout = cartCheckout([first, second], availableCartPayments([first, second])[1], shipping);
  assert.equal(checkout.productsTotal, 134_240);
  assert.equal(checkout.discount, 33_560);
  assert.equal(checkout.total, 139_480.5);
  assert.equal(checkout.amountUntilFreeShipping, null);
  assert.equal(checkout.freeShipping, false);
  assert.ok(checkout.message.includes(`CP 1414): ${formatPrice(5240.5)}`));
  assert.ok(checkout.message.includes(`Total estimado a pagar: ${formatPrice(139_480.5)}`));
  assert.ok(!checkout.message.includes("a cotizar"));
});

it("explicita en el mensaje cuando el envío todavía no fue cotizado", () => {
  const checkout = cartCheckout([first]);
  assert.ok(checkout.message.includes("Envío por Correo Argentino: a cotizar (no incluido en el total)"));
  assert.equal(checkout.total, checkout.productsTotal);
});

it("descarta una cotización vencida o de otra cantidad de prendas", () => {
  const quote = { postalCode: "1414", quantity: 1, price: 5000,
    service: "Correo Argentino Clásico", expiresAt: new Date(Date.now() + 60_000).toISOString() };
  assert.equal(cartCheckout([first], undefined, quote).total, 137_800);
  assert.equal(cartCheckout([{ ...first, quantity: 1 }], undefined,
    { ...quote, expiresAt: new Date(Date.now() - 1).toISOString() }).total, 68_900);
});

it("ofrece envío gratis desde el total de prendas con el medio de pago elegido", () => {
  const shipping = { postalCode: "1414", quantity: 3, price: 5240.5,
    service: "Correo Argentino Clásico", expiresAt: new Date(Date.now() + 60_000).toISOString() };
  const payment = availableCartPayments([first, second])[1];
  const below = cartCheckout([first, second], payment, shipping, 140_000);
  assert.equal(below.productsTotal, 134_240);
  assert.equal(below.amountUntilFreeShipping, 5760);
  assert.equal(below.shippingPrice, 5240.5);
  assert.equal(below.freeShipping, false);

  const free = cartCheckout([first, second], payment, shipping, 134_240);
  assert.equal(free.amountUntilFreeShipping, 0);
  assert.equal(free.shippingPrice, 0);
  assert.equal(free.total, 134_240);
  assert.equal(free.freeShipping, true);
  assert.match(free.message, /Envío gratis por Correo Argentino Clásico a domicilio \(CP 1414\)/);
  assert.ok(free.message.includes(`Total estimado a pagar: ${formatPrice(134_240)}`));
});

it("sin cotización vigente no confirma envío gratis aunque se alcance el mínimo", () => {
  const checkout = cartCheckout([first], undefined, undefined, 100_000);
  assert.equal(checkout.amountUntilFreeShipping, 0);
  assert.equal(checkout.freeShipping, false);
  assert.equal(checkout.shippingPrice, null);
  assert.match(checkout.message, /a cotizar/);
});
