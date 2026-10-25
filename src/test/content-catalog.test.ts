import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { catalogCategories, categoriesForProducts, defaults, legacyHomeCategoryCards, productsWithCategoryNames, resolveContent, visibleStoreProducts } from "../lib/content";
import { categoryIdForName, prepareProductsForSave, sortProductsByCreation } from "../lib/products";
import { referencedProductIds, resolveImageSource } from "../lib/image-source";
import { contentSchemas } from "../lib/content-schema";

describe("Catálogo y categorías heredadas", () => {
  it("conserva la categoría de productos anteriores y permite renombrarla sin reasignarlos", () => {
    const [product] = resolveContent("products", [{
      id: "old", name: "Vestido", category: "Vestidos", price: 100, image: "", section: "nuevo",
    }]);
    assert.equal(product.categoryId, categoryIdForName("Vestidos"));

    const texts = resolveContent("texts", {
      ...defaults.texts,
      categories: [{ name: "Vestidos", img: "/vestidos.jpg" }],
    });
    const categories = categoriesForProducts(texts.categories, [product]);
    assert.deepEqual(categories[0], { id: categoryIdForName("Vestidos"), name: "Vestidos", hidden: false });
    assert.equal(productsWithCategoryNames([product], [{ ...categories[0], name: "Vestidos de lino" }])[0]?.category, "Vestidos de lino");
    assert.deepEqual(resolveContent("categories", categories), categories);
    assert.deepEqual(catalogCategories(null, texts, [product]), categories);
    assert.deepEqual(catalogCategories([], texts, [product]), []);
    assert.deepEqual(contentSchemas.categories.parse([{ id: "vestidos", name: "Vestidos", img: "/vestidos.jpg", productId: "old" }]), [
      { id: "vestidos", name: "Vestidos" },
    ]);
  });

  it("pone primero los productos nuevos y mantiene el orden heredado cuando no hay fechas", () => {
    const products = resolveContent("products", [
      { id: "old-a", name: "A", category: "Tops", price: 100, image: "", section: "nuevo" },
      { id: "old-b", name: "B", category: "Tops", price: 100, image: "", section: "nuevo" },
      { id: "new", name: "C", category: "Tops", price: 100, image: "", section: "nuevo", createdAt: "2026-10-24T12:00:00.000Z" },
    ]);
    assert.deepEqual(sortProductsByCreation(products).map((product) => product.id), ["new", "old-a", "old-b"]);
  });

  it("separa las tarjetas del inicio y conserva sus fotos heredadas", () => {
    const categories = [{ id: "vestidos", name: "Vestidos" }];
    const products = resolveContent("products", [{ id: "uno", name: "Vestido", category: "Vestidos", categoryId: "vestidos", price: 100, image: "", section: "nuevo" }]);
    const legacyCards = legacyHomeCategoryCards(categories, { categories: [{ name: "Vestidos", img: "/vieja.jpg" }] }, [
      { id: "vestidos", name: "Vestidos", img: "/actual.jpg", productId: "uno" },
    ], products);
    assert.deepEqual(legacyCards, [{ id: "vestidos", categoryId: "vestidos", img: "/actual.jpg", hidden: true, productId: "uno" }]);
    assert.equal(legacyHomeCategoryCards(categories, { homeCategoryCards: [] }, [], products), null);
    assert.deepEqual(resolveContent("texts", { ...defaults.texts, homeCategoryCards: [] }).homeCategoryCards, []);
    assert.deepEqual(contentSchemas.texts.parse({ homeCategoryCards: legacyCards }).homeCategoryCards, legacyCards);
  });

  it("oculta productos individuales y todos los de una categoría oculta", () => {
    const products = resolveContent("products", [
      { id: "a", name: "A", category: "Vestidos", categoryId: "vestidos", price: 100, image: "", section: "nuevo" },
      { id: "b", name: "B", category: "Vestidos", categoryId: "vestidos", price: 100, image: "", section: "nuevo", hidden: true },
      { id: "c", name: "C", category: "Tops", categoryId: "tops", price: 100, image: "", section: "sale" },
    ]);
    const categories = resolveContent("categories", [{ id: "vestidos", name: "Vestidos" }, { id: "tops", name: "Tops", hidden: true }]);
    assert.deepEqual(visibleStoreProducts(products, categories).map((product) => product.id), ["a"]);
    assert.deepEqual(visibleStoreProducts(products, categories.map((category) => ({ ...category, hidden: false }))).map((product) => product.id), ["a", "c"]);
    assert.equal(resolveContent("texts", {}).homeCategoryCards.every((card) => card.hidden), true);
    assert.equal(resolveContent("texts", { homeCategoryCards: [{ id: "uno", categoryId: "vestidos", img: "" }] }).homeCategoryCards[0]?.hidden, true);
  });

  it("ignora fechas enviadas por el cliente y no permite reordenar productos anteriores", () => {
    const current = [
      { id: "old-a", name: "A", category: "Tops", price: 100, image: "" },
      { id: "old-b", name: "B", category: "Tops", price: 100, image: "" },
    ];
    const saved = prepareProductsForSave([
      { ...current[1], createdAt: "2099-01-01T00:00:00.000Z" },
      { ...current[0], createdAt: "2099-01-01T00:00:00.000Z" },
      { ...current[0], id: "new", createdAt: "2000-01-01T00:00:00.000Z" },
    ], current, Date.UTC(2026, 9, 24));
    assert.deepEqual(saved.map((product) => product.id), ["new", "old-a", "old-b"]);
    assert.equal(saved[0]?.createdAt, "2026-10-24T00:00:00.002Z");
    assert.equal(saved[1]?.createdAt, undefined);
  });
});

describe("Fotos compartidas con productos", () => {
  const products = [{ id: "vestido", name: "Vestido", category: "Vestidos", price: 100, image: "/vestido.jpg" }];

  it("resuelve la foto actual del producto sin copiar su URL a la sección", () => {
    const banner = { img: "", productId: "vestido" };
    assert.equal(resolveImageSource(banner, products), "/vestido.jpg");
    assert.equal(resolveImageSource(banner, [{ ...products[0], image: "/vestido-nuevo.jpg" }]), "/vestido-nuevo.jpg");
    assert.equal(banner.img, "");
    assert.equal(resolveImageSource({ img: "/propia.jpg" }, products), "/propia.jpg");
  });

  it("detecta referencias en banners, textos y portadas", () => {
    assert.deepEqual(referencedProductIds({
      hero: [{ img: "", productId: "vestido" }],
      texts: { split: { productId: "vestido" } },
      instagram: [{ image: "", productId: "falda" }],
    }), ["vestido", "vestido", "falda"]);
  });

  it("conserva la referencia al validar y resolver contenido guardado", () => {
    const parsed = contentSchemas.hero.parse([{
      img: "", productId: "vestido", kicker: "", title: "Vestido", cta: "Ver", promo: "", align: "left",
    }]);
    assert.equal(resolveContent("hero", parsed)[0]?.productId, "vestido");
    const texts = contentSchemas.texts.parse({ split: { img: "", productId: "vestido" } });
    assert.equal(resolveContent("texts", texts).split.productId, "vestido");
  });
});
