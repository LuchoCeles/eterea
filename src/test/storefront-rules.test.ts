import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hasRealDiscount, instagramEmbedUrl, instagramPermalink, instagramProfileUrl, productWithoutOffers, visibleAnnouncements, visibleInstagramPosts, visibleSaleProducts } from "../lib/storefront-rules";

const product = { id: "real", name: "Prenda", category: "Vestidos", price: 45000, oldPrice: 60000, tag: "-25%", image: "" };

describe("Reglas de lanzamiento de Etérea", () => {
  it("oculta los productos con descuento hasta que se habiliten las ofertas", () => {
    assert.deepEqual(visibleSaleProducts([product], false), []);
    assert.deepEqual(visibleSaleProducts([product], true), [product]);
  });

  it("exige un precio actual positivo menor al precio anterior", () => {
    assert.equal(hasRealDiscount(product), true);
    assert.equal(hasRealDiscount({ ...product, price: 60000 }), false);
    assert.equal(hasRealDiscount({ ...product, price: 0 }), false);
    assert.equal(hasRealDiscount({ ...product, oldPrice: undefined }), false);
  });

  it("filtra promociones ficticias cuando las ofertas están apagadas", () => {
    assert.deepEqual(
      visibleAnnouncements(["2x1 en pantalones", "15% OFF · código ETEREA15", "Envío gratis desde $80.000", "3 cuotas sin interés", "Etérea New Concept"], false),
      ["Etérea New Concept"],
    );
  });

  it("oculta precios tachados y etiquetas de descuento mientras las ofertas están apagadas", () => {
    const visible = productWithoutOffers(product, false);
    assert.equal(visible.oldPrice, undefined);
    assert.equal(visible.tag, undefined);
    assert.equal(visible.price, 60000);
    assert.equal(productWithoutOffers({ ...product, tag: "Nuevo" }, false).tag, "Nuevo");
  });

  it("acepta solo enlaces seguros de publicaciones y reels de Instagram", () => {
    assert.equal(instagramPermalink("https://www.instagram.com/reel/ABC123/?igsh=abc"), "https://www.instagram.com/reel/ABC123/");
    assert.equal(instagramPermalink("https://www.instagram.com/p/ABC123/"), "https://www.instagram.com/p/ABC123/");
    assert.equal(instagramPermalink("https://instagram.com.evil.test/p/ABC123/"), null);
    assert.equal(instagramPermalink("javascript:alert(1)"), null);
    assert.equal(instagramPermalink("https://www.instagram.com/usuario.ejemplo/"), null);
    assert.equal(instagramEmbedUrl("https://www.instagram.com/reel/ABC123/?igsh=abc"), "https://www.instagram.com/reel/ABC123/embed/");
    assert.equal(instagramEmbedUrl("https://instagram.com.evil.test/p/ABC123/"), null);
  });

  it("construye el perfil desde un usuario editable sin aceptar dominios externos", () => {
    assert.equal(instagramProfileUrl("@nuevo.usuario"), "https://www.instagram.com/nuevo.usuario/");
    assert.equal(instagramProfileUrl("https://sitio.test/perfil"), null);
  });

  it("muestra solo publicaciones válidas y reconoce los reels", () => {
    const posts = [
      { id: "1", url: "https://www.instagram.com/reel/ABC123/?igsh=abc", image: "", title: "", kind: "post" as const },
      { id: "2", url: "https://instagram.com.evil.test/p/ABC123/", image: "", title: "", kind: "post" as const },
    ];
    assert.deepEqual(visibleInstagramPosts(posts), [
      { ...posts[0], url: "https://www.instagram.com/reel/ABC123/", kind: "reel" },
    ]);
  });
});
