import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ContentProvider } from "../components/providers/ContentProvider";
import { InstagramSection } from "../components/store/InstagramSection";
import { defaults, type InstagramPost } from "../lib/content";
import type { InstagramMediaAsset } from "../lib/instagram-media";

const posts: InstagramPost[] = Array.from({ length: 8 }, (_, index) => ({
  id: String(index),
  url: "https://www.instagram.com/p/P" + index + "/",
  image: "",
  title: "Publicación " + index,
  kind: "post",
}));

function renderInstagram(mediaAssets: Record<string, InstagramMediaAsset>, items = posts) {
  return renderToStaticMarkup(createElement(ContentProvider, {
    initialContent: { texts: defaults.texts, products: defaults.products, categories: defaults.categories },
    children: createElement(InstagramSection, { posts: items, mediaAssets }),
  }));
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
});

