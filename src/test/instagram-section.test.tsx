import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ContentProvider } from "../components/providers/ContentProvider";
import { ContactSection } from "../components/store/ContactSection";
import { Header } from "../components/store/Header";
import { InstagramSection } from "../components/store/InstagramSection";
import { defaults, type ContactSettings, type InstagramPost } from "../lib/content";
import { instagramMediaAsset } from "../lib/instagram-media";
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

function renderInstagram(mediaAssets: Record<string, InstagramMediaAsset>, items = posts, contact = defaults.contact,
  profilePicture: { username: string; url: string } | null = null) {
  return renderStorefrontSection(createElement(InstagramSection, { posts: items, mediaAssets, profilePicture }), contact);
}

describe("Galería del Home", () => {
  it("muestra hasta nueve portadas configuradas con sus enlaces, sin duplicarlas", () => {
    const items = posts.map((post, index) => ({ ...post, image: index ? "/portada-" + index + ".jpg" : "" }));
    const html = renderInstagram({}, items);
    const links = html.match(/href="https:\/\/www\.instagram\.com\/p\/P\d+\/"/g) ?? [];
    assert.equal(links.length, 7);
    assert.equal(new Set(links).size, 7);
    assert.ok(html.includes("grid-cols-3"));
    assert.ok(html.includes("/portada-1.jpg"));
    assert.ok(!html.includes('href="https://www.instagram.com/p/P0/"'));
    assert.ok(html.includes('href="https://www.instagram.com/p/P7/"'));
  });

  it("conserva el estado vacío cuando la API no aporta portadas", () => {
    const html = renderInstagram({});
    assert.ok(html.includes("Las publicaciones de Etérea van a aparecer acá."));
    assert.equal((html.match(/href="https:\/\/www\.instagram\.com\/p\/P\d+\/"/g) ?? []).length, 0);
  });

  it("renderiza portadas de IMAGE, CAROUSEL_ALBUM, VIDEO y REELS con sus enlaces originales", () => {
    const items = posts.slice(0, 4).map((post, index) => index === 3
      ? { ...post, url: "https://www.instagram.com/reel/R3/", kind: "reel" as const }
      : post);
    const assets = [
      instagramMediaAsset({ media_type: "IMAGE", media_url: "https://scontent.cdninstagram.com/v/image-cover.jpg" }),
      instagramMediaAsset({ media_type: "CAROUSEL_ALBUM", children: { data: [
        { media_type: "IMAGE", media_url: "https://scontent.cdninstagram.com/v/carousel-cover.jpg" },
      ] } }),
      instagramMediaAsset({ media_type: "VIDEO", media_url: "https://scontent.cdninstagram.com/v/video.mp4", thumbnail_url: "https://scontent.cdninstagram.com/v/video-cover.jpg" }),
      instagramMediaAsset({ media_type: "REELS", media_url: "https://scontent.cdninstagram.com/v/reel.mp4", thumbnail_url: "https://scontent.cdninstagram.com/v/reel-cover.jpg" }),
    ];
    const mediaAssets = Object.fromEntries(items.flatMap((post, index) => assets[index] ? [[post.url, assets[index] as InstagramMediaAsset]] : []));
    const html = renderInstagram(mediaAssets, items);
    for (const filename of ["image-cover.jpg", "carousel-cover.jpg", "video-cover.jpg", "reel-cover.jpg"]) assert.ok(html.includes(filename));
    for (const post of items) assert.ok(html.includes(`href="${post.url}"`));
  });

  it("usa el perfil configurado y oculta el enlace cuando falta", () => {
    const configured = renderInstagram({}, [], {
      ...defaults.contact,
      instagramUsername: "cuenta.eterea",
      whatsapp: "+54 9 223 555-0188",
    });
    assert.ok(configured.includes("@cuenta.eterea"));
    assert.ok(configured.includes('href="https://www.instagram.com/cuenta.eterea/"'));
    assert.ok(configured.includes("Sigamos cerca."));
    assert.ok(configured.includes("Descubrí nuestras novedades, inspirate con Etérea y escribinos cuando quieras."));
    assert.ok(!configured.includes("Un poquito más de Etérea"));
    assert.ok(configured.includes('href="https://wa.me/5492235550188?text='));
    assert.ok(configured.includes("Escribinos por WhatsApp"));

    const noWhatsApp = renderInstagram({}, [], { ...defaults.contact, whatsapp: "sin número" });
    assert.ok(!noWhatsApp.includes("wa.me/"));

    const empty = renderInstagram({}, []);
    assert.ok(!empty.includes("@eterea.newconcept"));
    assert.ok(!empty.includes("Seguinos en Instagram"));
  });

  it("mantiene el iPhone proporcionado sin asociar el nombre de Etérea a una cuenta de prueba", () => {
    const html = renderInstagram({}, [], { ...defaults.contact, instagramUsername: "logabytedev" });
    assert.ok(html.includes("max-w-[290px]"));
    assert.ok(html.includes("aspect-[1/2]"));
    assert.ok(html.includes("w-[24cqw]"));
    assert.ok(html.includes("@logabytedev"));
    assert.ok(!html.includes("ETÉREA NEW CONCEPT"));
  });

  it("muestra la foto de la cuenta conectada y descarta una de otra cuenta", () => {
    const contact = { ...defaults.contact, instagramUsername: "cuenta.actual" };
    const picture = { username: "cuenta.actual", url: "https://scontent.cdninstagram.com/current.jpg" };
    const html = renderInstagram({}, [], contact, picture);
    assert.ok(html.includes(picture.url));
    assert.equal((html.match(/current\.jpg/g) ?? []).length >= 2, true);
    assert.ok(!html.includes("eterea-placeholder.svg"));

    const oldAccount = renderInstagram({}, [], contact, { username: "cuenta.anterior", url: "https://scontent.cdninstagram.com/old.jpg" });
    assert.ok(!oldAccount.includes("old.jpg"));
    assert.ok(oldAccount.includes("<svg"));
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
  it("mantiene navegación y carrito con el logo oficial centrado", () => {
    const html = renderToStaticMarkup(createElement(Header, {
      cartItems: [], cartAddCount: 0, whatsappNumber: "", onQuantityChange: () => undefined,
      onRemove: () => undefined, homeSections: defaults.texts.homeSections, isAdmin: false,
    }));
    assert.ok(html.includes('src="/assets/eterea-header-logo.svg"'));
    assert.ok(html.includes('aria-label="Etérea inicio"'));
    assert.ok(html.includes("Ver prendas"));
    assert.ok(html.includes("Abrir menú"));
    assert.ok(html.includes("Carrito, 0 prendas"));
    assert.ok(!html.includes("/assets/eterea-placeholder.svg"));
    assert.ok(html.includes("h-16"));
    assert.ok(html.includes("md:h-[72px]"));
    assert.ok(html.includes("sm:w-[120px]"));
  });
});

