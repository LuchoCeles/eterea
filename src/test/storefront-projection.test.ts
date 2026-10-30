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
      description: "Descripción extensa", sizes: ["S", "M"], colors: ["Azul"],
      soldOut: true, soldOutColors: ["Azul"], section: "sale", hidden: true,
    };
    const listing = productForListing(product);
    assert.equal(listing.description, undefined);
    assert.equal(listing.images, undefined);
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
