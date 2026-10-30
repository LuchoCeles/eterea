import assert from "node:assert/strict";
import { it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ProductPaymentPricesEditor } from "../components/admin/ProductPaymentPricesEditor";
import { ProductCardPrice } from "../components/store/ProductCardPrice";
import { ProductDetailPrice } from "../components/store/ProductDetailPrice";
import { calculateDiscountedPrice, rebasePaymentPrices } from "../lib/payment-prices";
import { createProductDraft } from "../lib/product-draft";
import { formatPrice, type Product } from "../lib/products";

it("calcula los descuentos sobre el precio base sin pedir una referencia", () => {
  const html = renderToStaticMarkup(createElement(ProductPaymentPricesEditor, {
    prices: [{ label: "Efectivo", price: 48_000 }],
    basePrice: 68_900,
    onChange: () => {},
  }));

  assert.doesNotMatch(html, /Precio de referencia para las formas de pago/);
  assert.doesNotMatch(html, /<option value="previous"/);
  assert.match(html, /descuento sobre el precio actual/);
  assert.equal(calculateDiscountedPrice(60_000, 20), 48_000);
  assert.equal(calculateDiscountedPrice(68_900, 20), 55_120);
});

it("crea un producto con Transferencia como medio de pago base", () => {
  const product = createProductDraft({ id: "vestidos", name: "Vestidos" });

  assert.equal(product.price, 0);
  assert.deepEqual(product.paymentPrices, [{ label: "Transferencia", price: 0 }]);
  assert.equal(product.categoryId, "vestidos");
  const html = renderToStaticMarkup(createElement(ProductPaymentPricesEditor, {
    prices: product.paymentPrices ?? [],
    basePrice: product.price,
    basePayment: true,
    onChange: () => {},
  }));
  assert.match(html, /Transferencia/);
  assert.match(html, /Este importe se carga en el campo «Precio actual»/);
  assert.doesNotMatch(html, /Quitar precio de Transferencia/);
});

it("usa el precio base cuando no hay precio anterior", () => {
  const html = renderToStaticMarkup(createElement(ProductPaymentPricesEditor, {
    prices: [],
    basePrice: 68_900,
    onChange: () => {},
  }));

  assert.doesNotMatch(html, /Precio de referencia para las formas de pago/);
  assert.match(html, /descuento sobre el precio actual/);
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

const cardProduct: Product = {
  id: "precio-card", name: "Prenda", category: "Vestidos", image: "",
  price: 6_900, oldPrice: 8_500,
  paymentPrices: [
    { label: "Efectivo", price: 6_000 },
    { label: "Transferencia", price: 5_520 },
    { label: "Tarjeta", price: 6_900 },
  ],
};

it("destaca el precio en efectivo sin repetir el precio base en la ficha", () => {
  const html = renderToStaticMarkup(createElement(ProductDetailPrice, {
    product: {
      price: 68_900,
      paymentPrices: [
        { label: "Efectivo", price: 55_120 },
        { label: "Transferencia", price: 68_900 },
      ],
    },
  }));

  assert.equal(html.split(formatPrice(68_900)).length - 1, 1);
  assert.match(html, /con Transferencia/);
  assert.match(html, /text-3xl font-semibold/);
  assert.ok(html.includes(formatPrice(55_120)));
  assert.match(html, /con Efectivo/);
});

it("muestra un solo precio si no existe un medio más barato", () => {
  const html = renderToStaticMarkup(createElement(ProductDetailPrice, {
    product: { price: 68_900, paymentPrices: [{ label: "Transferencia", price: 68_900 }] },
  }));

  assert.equal(html.split(formatPrice(68_900)).length - 1, 1);
  assert.doesNotMatch(html, /text-3xl font-semibold/);
});

it("muestra el descuento y solo el menor de varios precios por forma de pago", () => {
  const html = renderToStaticMarkup(createElement(ProductCardPrice, { product: cardProduct }));

  assert.ok(html.includes(formatPrice(8_500)));
  assert.ok(html.includes(formatPrice(6_900)));
  assert.match(html, /19% OFF/);
  assert.ok(html.includes(`${formatPrice(5_520)} <span class="font-normal">con Transferencia`));
  assert.ok(!html.includes(formatPrice(6_000)));
  assert.ok(!html.includes("con Tarjeta"));
});

it("no agrega un segundo precio si hay una sola forma de pago", () => {
  const html = renderToStaticMarkup(createElement(ProductCardPrice, {
    product: { ...cardProduct, oldPrice: undefined, paymentPrices: [{ label: "Transferencia", price: 5_520 }] },
  }));

  assert.ok(html.includes(formatPrice(6_900)));
  assert.ok(!html.includes(formatPrice(5_520)));
  assert.ok(!html.includes("OFF"));
});

it("muestra el menor medio de pago aunque la prenda no tenga descuento", () => {
  const html = renderToStaticMarkup(createElement(ProductCardPrice, {
    product: { ...cardProduct, oldPrice: undefined },
  }));

  assert.ok(html.includes(formatPrice(6_900)));
  assert.ok(html.includes(formatPrice(5_520)));
  assert.ok(html.includes("con Transferencia"));
  assert.ok(!html.includes("OFF"));
});

it("con los importes de la captura, intercambiar base y anterior activa el descuento de esa prenda", () => {
  const product = {
    ...cardProduct,
    price: 68_900,
    oldPrice: 60_000,
    paymentPrices: [
      { label: "Efectivo", price: 55_120 },
      { label: "Transferencia", price: 68_900 },
    ],
  };
  const before = renderToStaticMarkup(createElement(ProductCardPrice, { product }));
  const after = renderToStaticMarkup(createElement(ProductCardPrice, {
    product: { ...product, price: product.oldPrice, oldPrice: product.price },
  }));

  assert.ok(before.includes(formatPrice(55_120)));
  assert.ok(!before.includes("OFF"));
  assert.ok(after.includes(formatPrice(68_900)));
  assert.ok(after.includes(formatPrice(60_000)));
  assert.match(after, /13% OFF/);
  assert.ok(after.includes(`${formatPrice(55_120)} <span class="font-normal">con Efectivo`));
});
