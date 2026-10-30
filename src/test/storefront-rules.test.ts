import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { automaticProductTag, hasRealDiscount, instagramEmbedUrl, instagramPermalink, instagramProfileUrl, recentInstagramPosts, visibleAnnouncements, visibleInstagramPosts } from "../lib/storefront-rules";

const product = { id: "real", name: "Prenda", category: "Vestidos", price: 45000, oldPrice: 60000, tag: "-25%", image: "" };

describe("Reglas de lanzamiento de Etérea", () => {
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

  it("activa Oferta por los precios aunque el producto no esté en esa sección", () => {
    assert.equal(automaticProductTag({ ...product, section: null }, true), "Oferta");
    assert.equal(automaticProductTag({ ...product, section: "nuevo" }, true), "Oferta");
    assert.equal(automaticProductTag({ ...product, section: "sale" }, true), "Oferta");
  });

  it("respeta el interruptor de ofertas y usa Nuevo solo para la sección correspondiente", () => {
    assert.equal(automaticProductTag({ ...product, section: null }, false), undefined);
    assert.equal(automaticProductTag({ ...product, section: "sale" }, false), undefined);
    assert.equal(automaticProductTag({ ...product, section: "nuevo", oldPrice: undefined }, true), "Nuevo");
    assert.equal(automaticProductTag({ ...product, section: "nuevo" }, false), "Nuevo");
    assert.equal(automaticProductTag({ ...product, section: "sale", oldPrice: undefined }, true), undefined);
    assert.equal(automaticProductTag({ ...product, section: null, oldPrice: 40_000 }, true), undefined);
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

  it("ordena el feed real, elimina duplicados y conserva candidatas para seis portadas", () => {
    const media = Array.from({ length: 13 }, (_, index) => ({
      id: String(index), url: `https://www.instagram.com/p/P${index}/`,
      permalink: `https://www.instagram.com/p/P${index}/`,
      timestamp: new Date(Date.UTC(2026, 9, index + 1)).toISOString(),
    }));
    const posts = recentInstagramPosts([media[0], ...media.reverse(),
      { ...media[0], id: "duplicado" },
      { id: "ajeno", permalink: "https://otro.sitio/p/X/", timestamp: "2026-10-30T00:00:00Z" },
    ]);
    assert.equal(posts.length, 12);
    assert.equal(posts[0]?.id, "12");
    assert.equal(posts.at(-1)?.id, "1");
    assert.equal(new Set(posts.map((post) => post.url)).size, 12);
    assert.equal(recentInstagramPosts(posts.slice(0, 3).map((post, index) => ({
      ...post, permalink: post.url, timestamp: new Date(Date.UTC(2026, 9, 13 - index)).toISOString(),
    })), 6).length, 3);
  });
});
