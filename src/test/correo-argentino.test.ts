import assert from "node:assert/strict";
import { it } from "node:test";
import { validPostalCode } from "../lib/shipping";
import { shippingSettingsSchema } from "../lib/shipping-settings";
import { quoteCorreoArgentinoApi, type CorreoArgentinoConfig } from "../server/correo-argentino-api";
import { decryptShippingPassword, encryptShippingPassword } from "../server/shipping-crypto";

it("valida códigos postales argentinos de cuatro dígitos", () => {
  assert.equal(validPostalCode("1414"), true);
  assert.equal(validPostalCode("B1414ABC"), false);
  assert.equal(validPostalCode("123"), false);
  assert.equal(validPostalCode("12345"), false);
});

it("cotiza el peso y las medidas del carrito con MiCorreo sin exponer credenciales", async () => {
  const previousFetch = globalThis.fetch;
  const calls: { url: string; init?: RequestInit }[] = [];
  const settings: CorreoArgentinoConfig = {
    base: "https://apitest.correoargentino.com.ar/micorreo/v1", user: "usuario", password: "clave",
    customerId: "000123", origin: "1000", itemWeight: 400, packageWeight: 100,
    itemHeight: 3, packageHeight: 5, width: 30, length: 40, revision: 1,
  };
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    if (String(input).endsWith("/token")) return Response.json({ token: "prueba" });
    return Response.json({ validTo: new Date(Date.now() + 120_000).toISOString(), rates: [
      { deliveredType: "S", productType: "CP", productName: "Correo Argentino Sucursal", price: 1000 },
      { deliveredType: "D", productType: "EP", productName: "Correo Argentino Expreso", price: 6500 },
      { deliveredType: "D", productType: "CP", productName: "Correo Argentino Clásico", price: 5123.45 },
    ] });
  }) as typeof fetch;
  try {
    const quote = await quoteCorreoArgentinoApi(settings, "1414", 2, "D");
    assert.equal(quote.price, 5123.45);
    assert.equal(quote.quantity, 2);
    assert.equal(quote.deliveryType, "D");
    assert.equal(calls.length, 2);
    assert.ok(calls[0].url.includes("apitest.correoargentino.com.ar"));
    assert.equal(calls[0].init?.headers && (calls[0].init.headers as Record<string, string>).Authorization,
      `Basic ${Buffer.from("usuario:clave").toString("base64")}`);
    const body = JSON.parse(String(calls[1].init?.body));
    assert.deepEqual(body, {
      customerId: "000123", postalCodeOrigin: "1000", postalCodeDestination: "1414",
      deliveredType: "D", dimensions: { weight: 900, height: 11, width: 30, length: 40 },
    });
    assert.equal(JSON.stringify(quote).includes("clave"), false);

    const branchQuote = await quoteCorreoArgentinoApi(settings, "1414", 2, "S");
    assert.equal(branchQuote.price, 1000);
    assert.equal(branchQuote.deliveryType, "S");
    assert.equal(calls.length, 3);
    assert.equal(JSON.parse(String(calls[2].init?.body)).deliveredType, "S");
  } finally {
    globalThis.fetch = previousFetch;
  }
});

it("valida los requisitos del formulario de envíos", () => {
  const valid = {
    environment: "production", apiUser: "usuario", password: "clave", customerId: "000123",
    postalCodeOrigin: "1000", itemWeightGrams: 400, packageWeightGrams: 100,
    itemHeightCm: 3, packageHeightCm: 5, packageWidthCm: 30, packageLengthCm: 40,
    freeShippingThreshold: 100_000,
  };
  assert.equal(shippingSettingsSchema.safeParse(valid).success, true);
  assert.equal(shippingSettingsSchema.safeParse({ ...valid, postalCodeOrigin: "10" }).success, false);
  assert.equal(shippingSettingsSchema.safeParse({ ...valid, itemWeightGrams: 25_000 }).success, false);
  assert.equal(shippingSettingsSchema.safeParse({ ...valid, environment: "otro" }).success, false);
  assert.equal(shippingSettingsSchema.safeParse({ ...valid, freeShippingThreshold: null }).success, true);
  assert.equal(shippingSettingsSchema.safeParse({ ...valid, freeShippingThreshold: -1 }).success, false);
});

it("cifra la contraseña de MiCorreo y detecta cambios del secreto o del texto cifrado", () => {
  const secret = "secreto-largo-para-pruebas-de-correo-argentino";
  const stored = encryptShippingPassword("clave-de-prueba", secret);
  assert.equal(decryptShippingPassword(stored, secret), "clave-de-prueba");
  assert.equal(decryptShippingPassword(stored, secret + "distinto"), null);
  assert.equal(decryptShippingPassword({ ...stored, encryptedPassword: "AA" }, secret), null);
  assert.equal(JSON.stringify(stored).includes("clave-de-prueba"), false);
});
