import assert from "node:assert/strict";
import { it } from "node:test";
import { productEditorSnapshot } from "../lib/product-editor-snapshot";
import type { StoreProduct } from "../lib/content";

const product: StoreProduct = {
  id: "vestido",
  name: "Vestido Lino",
  categoryId: "vestidos",
  category: "Vestidos",
  section: null,
  price: 68_900,
  image: "foto-1",
  images: ["foto-1", "foto-2"],
};

it("detecta cambios editables y deja de detectarlos cuando se revierten", () => {
  const images = ["foto-1", "foto-2"];
  const original = productEditorSnapshot(product, images);

  assert.notEqual(productEditorSnapshot({ ...product, name: "Vestido Lino Azul" }, images), original);
  assert.notEqual(productEditorSnapshot({ ...product, hidden: true }, images), original);
  assert.notEqual(productEditorSnapshot({ ...product, paymentPrices: [{ label: "Efectivo", price: 60_000 }] }, images), original);
  assert.equal(productEditorSnapshot({ ...product, name: "Vestido Lino", hidden: false }, images), original);
});

it("detecta fotos nuevas, recortes y cambios de orden, incluso si el resto del producto no cambia", () => {
  const original = productEditorSnapshot(product, ["foto-1", "foto-2"]);

  assert.notEqual(productEditorSnapshot(product, ["foto-2", "foto-1"]), original);
  assert.notEqual(productEditorSnapshot(product, ["blob:recorte", "foto-2"]), original);
  assert.notEqual(productEditorSnapshot(product, ["foto-1", "foto-2", "blob:nueva"]), original);
  assert.equal(productEditorSnapshot(product, ["foto-1", "foto-2"]), original);
});
