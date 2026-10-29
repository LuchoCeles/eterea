import assert from "node:assert/strict";
import { it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ProductPaymentPricesEditor } from "../components/admin/ProductPaymentPricesEditor";
import { calculateDiscountedPrice, rebasePaymentPrices } from "../lib/payment-prices";

it("ofrece ambos precios como referencia aunque el anterior sea menor que el base", () => {
  const html = renderToStaticMarkup(createElement(ProductPaymentPricesEditor, {
    prices: [{ label: "Efectivo", price: 48_000 }],
    basePrice: 68_900,
    oldPrice: 60_000,
    onChange: () => {},
  }));

  assert.match(html, /Precio de referencia para las formas de pago/);
  assert.match(html, /Precio anterior \(\$60\.000\)/);
  assert.match(html, /Precio base \(\$68\.900\)/);
  assert.match(html, /<option value="base" selected="">Precio base/);
  assert.equal(calculateDiscountedPrice(60_000, 20), 48_000);
  assert.equal(calculateDiscountedPrice(68_900, 20), 55_120);
});

it("usa el precio base cuando no hay precio anterior", () => {
  const html = renderToStaticMarkup(createElement(ProductPaymentPricesEditor, {
    prices: [],
    basePrice: 68_900,
    onChange: () => {},
  }));

  assert.doesNotMatch(html, /Precio de referencia para las formas de pago/);
  assert.match(html, /Los descuentos se calculan sobre el precio base/);
});

it("recalcula todos los medios al cambiar la referencia y conserva sus descuentos", () => {
  const prices = [
    { label: "Transferencia", price: 68_900 },
    { label: "Efectivo", price: 55_120 },
  ];

  const previous = rebasePaymentPrices(prices, 68_900, 60_000, [null, 20]);
  assert.deepEqual(previous, [
    { label: "Transferencia", price: 60_000 },
    { label: "Efectivo", price: 48_000 },
  ]);
  assert.deepEqual(rebasePaymentPrices(previous, 60_000, 68_900, [null, 20]), prices);
  assert.deepEqual(rebasePaymentPrices(prices, 68_900, 60_000, [null, null]), previous);
});
