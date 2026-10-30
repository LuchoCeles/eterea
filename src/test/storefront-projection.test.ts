import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveContent, type StoreProduct } from "../lib/content";
import { productForListing } from "../lib/storefront-projection";

describe("Datos públicos de productos", () => {
  it("conserva precios, visibilidad y opciones mientras omite galería y descripción", () => {
    const product: StoreProduct = {
      id: "prenda-1", name: "Vestido", category: "Vestidos", categoryId: "vestidos",
      price: 100, oldPrice: 120, paymentPrices: [{ label: "Transferencia", price: 90 }],
      tag: "Oferta", image: "/portada.jpg", images: ["/portada.jpg", "/espalda.jpg"],
      coverSettings: { width: 1920, height: 1080, zoom: 1, x: 0, y: 0 },
      imageSettings: [{ width: 1920, height: 1080, format: "original", zoom: 1, x: 0, y: 0 }, null],
      description: "Descripción extensa", sizes: ["S", "M"], colors: ["Azul"],
      soldOut: true, soldOutColors: ["Azul"], section: "sale", hidden: true,
    };
    const listing = productForListing(product);
    assert.equal(listing.description, undefined);
    assert.equal(listing.images, undefined);
    assert.equal(listing.imageSettings, undefined);
    assert.deepEqual(listing.coverSettings, product.coverSettings);
    assert.deepEqual(listing.paymentPrices, product.paymentPrices);
    assert.deepEqual(listing.sizes, product.sizes);
    assert.deepEqual(listing.colors, product.colors);
    assert.equal(listing.soldOut, true);
    assert.deepEqual(listing.soldOutColors, ["Azul"]);
    assert.equal(listing.hidden, true);
    assert.equal(listing.image, product.image);
    assert.equal(listing.tag, undefined);
    assert.deepEqual(resolveContent("products", [listing])[0].images, [product.image]);
    assert.deepEqual(product.images, ["/portada.jpg", "/espalda.jpg"]);
  });
});
