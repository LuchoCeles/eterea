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
  assert.ok(checkout.message.includes(`Total a pagar: ${formatPrice(134_240)}`));
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
  assert.ok(checkout.message.includes(`Total a pagar: ${formatPrice(137_800)}`));
  assert.ok(!checkout.message.includes("Descuento:"));
});
