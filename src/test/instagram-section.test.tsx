import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ContentProvider } from "../components/providers/ContentProvider";
import { ContactSection } from "../components/store/ContactSection";
import { Header } from "../components/store/Header";
import { InstagramSection } from "../components/store/InstagramSection";
import { defaults, type ContactSettings, type InstagramPost } from "../lib/content";
import type { InstagramMediaAsset } from "../lib/instagram-media";

const posts: InstagramPost[] = Array.from({ length: 8 }, (_, index) => ({
  id: String(index),
  url: "https://www.instagram.com/p/P" + index + "/",
  image: "",
  title: "Publicación " + index,
  kind: "post",
}));

function renderStorefrontSection(children: ReactNode, contact: ContactSettings = defaults.contact) {
  return renderToStaticMarkup(createElement(ContentProvider, {
    initialContent: { texts: defaults.texts, products: defaults.products, categories: defaults.categories, contact },
    children,
  }));
}

function renderInstagram(mediaAssets: Record<string, InstagramMediaAsset>, items = posts, contact = defaults.contact) {
  return renderStorefrontSection(createElement(InstagramSection, { posts: items, mediaAssets }), contact);
}

describe("Galería del Home", () => {
  it("muestra hasta seis portadas configuradas con sus enlaces, sin duplicarlas", () => {
    const items = posts.map((post, index) => ({ ...post, image: index ? "/portada-" + index + ".jpg" : "" }));
    const html = renderInstagram({}, items);
    const links = html.match(/href="https:\/\/www\.instagram\.com\/p\/P\d+\/"/g) ?? [];
    assert.equal(links.length, 6);
    assert.equal(new Set(links).size, 6);
    assert.ok(html.includes("grid-cols-3"));
    assert.ok(html.includes("/portada-1.jpg"));
    assert.ok(!html.includes('href="https://www.instagram.com/p/P0/"'));
    assert.ok(!html.includes('href="https://www.instagram.com/p/P7/"'));
  });

  it("conserva el estado vacío cuando la API no aporta portadas", () => {
    const html = renderInstagram({});
    assert.ok(html.includes("Las publicaciones de Etérea van a aparecer acá."));
    assert.equal((html.match(/href="https:\/\/www\.instagram\.com\/p\/P\d+\/"/g) ?? []).length, 0);
  });

  it("usa el perfil configurado y oculta el enlace cuando falta", () => {
    const configured = renderInstagram({}, [], { ...defaults.contact, instagramUsername: "cuenta.eterea" });
    assert.ok(configured.includes("@cuenta.eterea"));
    assert.ok(configured.includes('href="https://www.instagram.com/cuenta.eterea/"'));
    const empty = renderInstagram({}, []);
    assert.ok(!empty.includes("@eterea.newconcept"));
    assert.ok(!empty.includes("Seguinos en Instagram"));
  });
});

describe("Contacto del Home", () => {
  it("construye los enlaces desde la configuración y omite los medios sin datos", () => {
    const configured = renderStorefrontSection(createElement(ContactSection), {
      whatsapp: "+54 9 223 555-0188",
      instagramUsername: "@cuenta.eterea",
    });
    assert.ok(configured.includes('href="https://www.instagram.com/cuenta.eterea/"'));
    assert.ok(configured.includes("@cuenta.eterea"));
    assert.ok(configured.includes('href="https://wa.me/5492235550188?text='));
    assert.ok(configured.includes("+54 9 223 555-0188"));

    const empty = renderStorefrontSection(createElement(ContactSection));
    assert.ok(empty.includes("Todavía no hay medios de contacto configurados."));
    assert.ok(!empty.includes("wa.me/"));
    assert.ok(!empty.includes("@eterea.newconcept"));
  });
});

describe("Header del Home", () => {
  it("mantiene navegación y carrito con la marca centrada en texto y sin imagen", () => {
    const html = renderToStaticMarkup(createElement(Header, {
      cartItems: [], cartAddCount: 0, whatsappNumber: "", onQuantityChange: () => undefined,
      onRemove: () => undefined, homeSections: defaults.texts.homeSections, isAdmin: false,
    }));
    assert.ok(html.includes("ETÉREA"));
    assert.ok(html.includes("Ver prendas"));
    assert.ok(html.includes("Abrir menú"));
    assert.ok(html.includes("Carrito, 0 prendas"));
    assert.ok(!html.includes("/assets/eterea-placeholder.svg"));
    assert.ok(html.includes("h-16"));
    assert.ok(html.includes("md:h-[72px]"));
    assert.ok(html.includes("sm:text-2xl"));
  });
});

