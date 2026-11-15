import assert from "node:assert/strict";
import { it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ShippingPolicyProvider } from "../components/providers/ShippingPolicyProvider";
import { ShippingDeliveryOptions } from "../components/store/ShippingDeliveryOptions";
import { formatPrice } from "../lib/products";
import { resolveShippingDeliveryType, validPostalCode } from "../lib/shipping";
import { shippingSettingsSchema } from "../lib/shipping-settings";
import { quoteCorreoArgentinoApi, type CorreoArgentinoConfig } from "../server/correo-argentino-api";

it("valida códigos postales argentinos de cuatro dígitos", () => {
  assert.equal(validPostalCode("1414"), true);
  assert.equal(validPostalCode("B1414ABC"), false);
  assert.equal(validPostalCode("123"), false);
  assert.equal(validPostalCode("12345"), false);
});

it("elige una entrega habilitada cuando el carrito recuerda otra opción", () => {
  assert.equal(resolveShippingDeliveryType("D", ["S"]), "S");
  assert.equal(resolveShippingDeliveryType("S", ["D"]), "D");
  assert.equal(resolveShippingDeliveryType("S", ["D", "S"]), "S");
});

it("muestra solo las modalidades habilitadas en el selector", () => {
  const markup = renderToStaticMarkup(createElement(ShippingPolicyProvider, {
    configured: true, threshold: null, homeDeliveryEnabled: false, branchDeliveryEnabled: true,
    children: createElement(ShippingDeliveryOptions, { value: "S", onChange: () => undefined,
      results: { D: { loading: false }, S: { loading: false, quote: {
        postalCode: "1414", quantity: 1, price: 3000, deliveryType: "S", expiresAt: new Date(Date.now() + 60_000).toISOString(),
      } } }, freeShipping: false }),
  }));
  assert.match(markup, /Retiro por sucursal/);
  assert.doesNotMatch(markup, /Envío Clásico/);
});

it("muestra las dos tarifas en tarjetas seleccionables", () => {
  const expiresAt = new Date(Date.now() + 60_000).toISOString();
  const markup = renderToStaticMarkup(createElement(ShippingPolicyProvider, {
    configured: true, threshold: null, homeDeliveryEnabled: true, branchDeliveryEnabled: true,
    children: createElement(ShippingDeliveryOptions, { value: "S", onChange: () => undefined,
      results: { D: { loading: false, quote: { postalCode: "1414", quantity: 1, price: 7000, deliveryType: "D", expiresAt } },
        S: { loading: false, quote: { postalCode: "1414", quantity: 1, price: 3000, deliveryType: "S", expiresAt } } },
      freeShipping: false }),
  }));
  assert.match(markup, /<fieldset class="space-y-2">/);
  assert.ok(markup.indexOf("Envío Clásico") < markup.indexOf("Retiro por sucursal"));
  assert.ok(markup.includes(formatPrice(7000)));
  assert.ok(markup.includes(formatPrice(3000)));
  assert.match(markup, /type="radio"/);
  assert.match(markup, /checked="" value="S"/);
  assert.doesNotMatch(markup, /<button/);
  assert.doesNotMatch(markup, /Coordinamos la sucursal por WhatsApp/);
});

it("muestra tarifas de consulta sin controles en la ficha del producto", () => {
  const expiresAt = new Date(Date.now() + 60_000).toISOString();
  const markup = renderToStaticMarkup(createElement(ShippingPolicyProvider, {
    configured: true, threshold: null, homeDeliveryEnabled: true, branchDeliveryEnabled: true,
    children: createElement(ShippingDeliveryOptions, { results: {
      D: { loading: false, quote: { postalCode: "1414", quantity: 1, price: 7000, deliveryType: "D", expiresAt } },
      S: { loading: false, quote: { postalCode: "1414", quantity: 1, price: 3000, deliveryType: "S", expiresAt } },
    }, freeShipping: false }),
  }));
  assert.ok(markup.includes(formatPrice(7000)));
  assert.ok(markup.includes(formatPrice(3000)));
  assert.doesNotMatch(markup, /<input|<button|<label/);
});

it("muestra tarjetas skeleton mientras llegan las tarifas", () => {
  const markup = renderToStaticMarkup(createElement(ShippingPolicyProvider, {
    configured: true, threshold: null, homeDeliveryEnabled: true, branchDeliveryEnabled: true,
    children: createElement(ShippingDeliveryOptions, { value: null, onChange: () => undefined,
      results: { D: { loading: true }, S: { loading: true } }, freeShipping: false }),
  }));
  assert.equal((markup.match(/role="status"/g) ?? []).length, 2);
  assert.match(markup, /animate-pulse/);
  assert.doesNotMatch(markup, /<input|<button/);
});

it("cotiza con el ID del comercio y una credencial de aplicación que queda en el servidor", async () => {
  const previousFetch = globalThis.fetch;
  const calls: { url: string; init?: RequestInit }[] = [];
  const settings: CorreoArgentinoConfig = {
    base: "https://apitest.correoargentino.com.ar/micorreo/v1", user: "aplicacion", password: "clave-app",
    customerId: "000123", origin: "1000", itemWeight: 400, packageWeight: 100,
    itemHeight: 3, packageHeight: 5, width: 30, length: 40, revision: 1,
    homeDeliveryEnabled: true, branchDeliveryEnabled: true, surcharge: 2000,
  };
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    if (String(input).endsWith("/token")) return Response.json({ token: "prueba", expire: new Date(Date.now() + 3600_000).toISOString() });
    return Response.json({ validTo: new Date(Date.now() + 120_000).toISOString(), rates: [
      { deliveredType: "S", productType: "CP", productName: "Correo Argentino Sucursal", price: 1000 },
      { deliveredType: "D", productType: "EP", productName: "Correo Argentino Expreso", price: 6500 },
      { deliveredType: "D", productType: "CP", productName: "Correo Argentino Clásico", price: 5123.45 },
    ] });
  }) as typeof fetch;
  try {
    const requestedAt = Date.now();
    const quote = await quoteCorreoArgentinoApi(settings, "1414", 2, "D");
    assert.equal(quote.price, 7123.45);
    assert.equal(quote.quantity, 2);
    assert.equal(quote.deliveryType, "D");
    assert.ok(Date.parse(quote.expiresAt) >= requestedAt + 12 * 60 * 60_000);
    assert.ok(Date.parse(quote.expiresAt) <= Date.now() + 12 * 60 * 60_000);
    assert.equal(calls.length, 2);
    assert.ok(calls[0].url.includes("apitest.correoargentino.com.ar"));
    assert.equal(calls[0].init?.headers && (calls[0].init.headers as Record<string, string>).Authorization,
      `Basic ${Buffer.from("aplicacion:clave-app").toString("base64")}`);
    const body = JSON.parse(String(calls[1].init?.body));
    assert.deepEqual(body, {
      customerId: "000123", postalCodeOrigin: "1000", postalCodeDestination: "1414",
      deliveredType: "D", dimensions: { weight: 900, height: 11, width: 30, length: 40 },
    });
    assert.equal(JSON.stringify(quote).includes("clave-app"), false);

    const branchQuote = await quoteCorreoArgentinoApi(settings, "1414", 2, "S");
    assert.equal(branchQuote.price, 3000);
    assert.equal(branchQuote.deliveryType, "S");
    assert.equal(calls.length, 3);
    assert.equal(JSON.parse(String(calls[2].init?.body)).deliveredType, "S");
  } finally {
    globalThis.fetch = previousFetch;
  }
});

it("mantiene visible una tarifa recién obtenida si MiCorreo informa un validTo pasado", async () => {
  const previousFetch = globalThis.fetch;
  const settings: CorreoArgentinoConfig = {
    base: "https://apitest.correoargentino.com.ar/micorreo/v1", user: "aplicacion", password: "clave-app",
    customerId: "000123", origin: "1000", itemWeight: 400, packageWeight: 100,
    itemHeight: 3, packageHeight: 5, width: 30, length: 40, revision: 5,
    homeDeliveryEnabled: true, branchDeliveryEnabled: true, surcharge: 0,
  };
  globalThis.fetch = (async (input: RequestInfo | URL) => String(input).endsWith("/token")
    ? Response.json({ token: "prueba" })
    : Response.json({ validTo: "2022-06-07T10:31:27.881-03:00", rates: [
      { deliveredType: "D", productType: "CP", price: 6500 },
    ] })) as typeof fetch;
  try {
    const quote = await quoteCorreoArgentinoApi(settings, "4000", 1, "D");
    assert.equal(quote.price, 6500);
    assert.ok(Date.parse(quote.expiresAt) > Date.now() + 11 * 60 * 60_000);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

it("valida los requisitos del formulario de envíos", () => {
  const valid = {
    environment: "production", customerId: "000123",
    postalCodeOrigin: "1000", itemWeightGrams: 400, packageWeightGrams: 100,
    itemHeightCm: 3, packageHeightCm: 5, packageWidthCm: 30, packageLengthCm: 40,
    homeDeliveryEnabled: true, branchDeliveryEnabled: true, shippingSurcharge: 2000,
    freeShippingThreshold: 100_000,
  };
  assert.equal(shippingSettingsSchema.safeParse(valid).success, true);
  assert.equal(shippingSettingsSchema.safeParse({ ...valid, postalCodeOrigin: "10" }).success, false);
  assert.equal(shippingSettingsSchema.safeParse({ ...valid, itemWeightGrams: 25_000 }).success, false);
  assert.equal(shippingSettingsSchema.safeParse({ ...valid, environment: "otro" }).success, false);
  assert.equal(shippingSettingsSchema.safeParse({ ...valid, freeShippingThreshold: null }).success, true);
  assert.equal(shippingSettingsSchema.safeParse({ ...valid, freeShippingThreshold: -1 }).success, false);
  assert.equal(shippingSettingsSchema.safeParse({ ...valid, homeDeliveryEnabled: false, branchDeliveryEnabled: false }).success, false);
  assert.equal(shippingSettingsSchema.safeParse({ ...valid, shippingSurcharge: -1 }).success, false);
  assert.equal(shippingSettingsSchema.safeParse({ ...valid, shippingSurcharge: 2.001 }).success, false);
});

it("renueva el token de la aplicación si MiCorreo lo rechaza", async () => {
  const previousFetch = globalThis.fetch;
  const calls: string[] = [];
  const settings: CorreoArgentinoConfig = {
    base: "https://apitest.correoargentino.com.ar/micorreo/v1", user: "aplicacion", password: "clave-app",
    customerId: "000123", origin: "1000", itemWeight: 400, packageWeight: 100,
    itemHeight: 3, packageHeight: 5, width: 30, length: 40, revision: 2,
    homeDeliveryEnabled: true, branchDeliveryEnabled: true, surcharge: 0,
  };
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const endpoint = String(input).endsWith("/token") ? "token" : "rates";
    calls.push(endpoint);
    if (endpoint === "token") return Response.json({ token: `token-${calls.length}` });
    if (calls.length === 2) return new Response(null, { status: 403 });
    assert.equal((init?.headers as Record<string, string>).Authorization, "Bearer token-3");
    return Response.json({ rates: [{ deliveredType: "D", productType: "CP", price: 1500 }] });
  }) as typeof fetch;
  try {
    const quote = await quoteCorreoArgentinoApi(settings, "2000", 1, "D");
    assert.equal(quote.price, 1500);
    assert.deepEqual(calls, ["token", "rates", "token", "rates"]);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

it("impide cotizar un tipo de entrega desactivado antes de consultar MiCorreo", async () => {
  const settings: CorreoArgentinoConfig = {
    base: "https://apitest.correoargentino.com.ar/micorreo/v1", user: "aplicacion", password: "clave-app",
    customerId: "000123", origin: "1000", itemWeight: 400, packageWeight: 100,
    itemHeight: 3, packageHeight: 5, width: 30, length: 40, revision: 3,
    homeDeliveryEnabled: false, branchDeliveryEnabled: true, surcharge: 2000,
  };
  await assert.rejects(quoteCorreoArgentinoApi(settings, "1414", 1, "D"), /no está habilitado/);
});

it("reintenta una sola vez los fallos transitorios de red al pedir token y tarifa", async () => {
  const previousFetch = globalThis.fetch;
  const calls: string[] = [];
  const settings: CorreoArgentinoConfig = {
    base: "https://apitest.correoargentino.com.ar/micorreo/v1", user: "aplicacion", password: "clave-app",
    customerId: "000123", origin: "1000", itemWeight: 400, packageWeight: 100,
    itemHeight: 3, packageHeight: 5, width: 30, length: 40, revision: 4,
    homeDeliveryEnabled: true, branchDeliveryEnabled: true, surcharge: 0,
  };
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const endpoint = String(input).endsWith("/token") ? "token" : "rates";
    calls.push(endpoint);
    if (calls.length === 1 || calls.length === 3) throw new TypeError("Fallo transitorio de red");
    return endpoint === "token" ? Response.json({ token: "token-recuperado" })
      : Response.json({ rates: [{ deliveredType: "D", productType: "CP", price: 6500 }] });
  }) as typeof fetch;
  try {
    const quote = await quoteCorreoArgentinoApi(settings, "3000", 1, "D");
    assert.equal(quote.price, 6500);
    assert.deepEqual(calls, ["token", "token", "rates", "rates"]);
  } finally {
    globalThis.fetch = previousFetch;
  }
});
