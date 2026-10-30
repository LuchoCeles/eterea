import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { catalogCategories, categoriesForProducts, defaults, legacyHomeCategoryCards, mergeTextSection, productsWithCategoryNames, resolveContent, visibleStoreProducts } from "../lib/content";
import { categoryIdForName, isProductSoldOut, prepareProductsForSave, sortProductsByCreation } from "../lib/products";
import { catalogProducts, homeProducts, sortProductsByAvailability } from "../lib/catalog-products";
import { referencedProductIds, resolveImageSource } from "../lib/image-source";
import { contentSchemas, textSectionSchemas } from "../lib/content-schema";
import { productHref, productSlug, slugifyProductName } from "../lib/product-slugs";

describe("URLs de productos", () => {
  const first = { id: "c942197d-37fb-4f0f-a2dc-98a9aac72739", name: "LESS DÚO GIGI DOTS", category: "Tops", price: 100, image: "" };
  const second = { ...first, id: "c4832af1-39db-4bd8-90c5-59d0f6e2f884" };

  it("normaliza el nombre sin acentos cuando es único", () => {
    assert.equal(slugifyProductName(first.name), "less-duo-gigi-dots");
    assert.equal(productHref(first, [first]), "/productos/less-duo-gigi-dots");
  });

  it("agrega un sufijo estable y distinto a los nombres repetidos", () => {
    const firstSlug = productSlug(first, [first, second]);
    const secondSlug = productSlug(second, [first, second]);
    assert.match(firstSlug, /^less-duo-gigi-dots-[a-z0-9]{6,13}$/);
    assert.notEqual(firstSlug, secondSlug);
    assert.equal(productSlug(first, [second, first]), firstSlug);
  });
});

describe("Catálogo y categorías heredadas", () => {
  it("muestra el catálogo vacío cuando no se guardó contenido", () => {
    const products = resolveContent("products", undefined);
    const categories = catalogCategories(null, resolveContent("texts", undefined), products);
    assert.deepEqual(products, []);
    assert.deepEqual(categories, []);
    assert.deepEqual(catalogProducts(products, categories), []);
  });

  it("guarda productos sin sección y los muestra solo en el catálogo", () => {
    const categories = [{ id: "vestidos", name: "Vestidos" }];
    const products = resolveContent("products", [{
      id: "sin-seccion", name: "Vestido", category: "Vestidos", categoryId: "vestidos",
      price: 80, image: "", section: null,
    }]);
    assert.equal(contentSchemas.products.safeParse(products).success, true);
    assert.deepEqual(catalogProducts(products, categories).map((product) => product.id), ["sin-seccion"]);
    assert.deepEqual(homeProducts(products), { newArrivals: [], sale: [] });
  });

  it("reconoce una oferta por sus precios aunque esté asignada a Lo nuevo", () => {
    const categories = [{ id: "vestidos", name: "Vestidos" }];
    const products = resolveContent("products", [
      { id: "rebajado", name: "Vestido", category: "Vestidos", categoryId: "vestidos", price: 80, oldPrice: 100, image: "", section: "nuevo" },
      { id: "sin-seccion", name: "Blusa", category: "Vestidos", categoryId: "vestidos", price: 50, oldPrice: 70, image: "", section: null },
    ]);
    const featured = homeProducts(products);
    assert.deepEqual(featured.newArrivals, []);
    assert.deepEqual(featured.sale.map((product) => product.id), ["rebajado"]);
    assert.deepEqual(catalogProducts(products, categories).map((product) => product.id), ["rebajado", "sin-seccion"]);
    assert.equal(catalogProducts(products, categories)[0]?.price, 80);
  });

  it("mantiene en el catálogo un producto de Ofertas sin descuento", () => {
    const categories = [{ id: "vestidos", name: "Vestidos" }];
    const products = resolveContent("products", [{
      id: "sin-descuento", name: "Vestido", category: "Vestidos", categoryId: "vestidos",
      price: 100, image: "", section: "sale",
    }]);
    assert.deepEqual(catalogProducts(products, categories).map((product) => product.id), ["sin-descuento"]);
    assert.deepEqual(homeProducts(products).sale, []);
  });

  it("guarda un apartado del inicio sin alterar los demás ni activar ofertas", () => {
    const original = resolveContent("texts", { benefits: [{ t: "Original", d: "" }], offers: { enabled: false } });
    const updated = mergeTextSection(original, "marquee", ["Nuevo texto"]);
    assert.deepEqual(updated.marquee, ["Nuevo texto"]);
    assert.deepEqual(updated.benefits, original.benefits);
    assert.deepEqual(updated.offers, original.offers);
    assert.deepEqual(original.marquee, defaults.texts.marquee);
    assert.deepEqual(resolveContent("texts", { benefits: [], marquee: [] }).benefits, []);
    assert.deepEqual(resolveContent("texts", { benefits: [], marquee: [] }).marquee, []);
    assert.deepEqual(resolveContent("texts", { homeSections: { hero: false } }).benefits, defaults.texts.benefits);
    assert.equal(contentSchemas.texts.safeParse({ homeSections: { otra: true } }).success, false);
    assert.equal(textSectionSchemas.marquee.safeParse(["Nuevo texto"]).success, true);
    assert.equal(textSectionSchemas.marquee.safeParse({ benefits: [] }).success, false);
  });

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

  it("conserva fotos heredadas y normaliza la portada de galerías nuevas", () => {
    const products = resolveContent("products", [
      { id: "legado", name: "Legado", category: "Tops", price: 100, image: "/original.jpg", section: "nuevo" },
      { id: "nuevo", name: "Nuevo", category: "Tops", price: 100, image: "/anterior.jpg", images: ["/portada.jpg", "/detalle.jpg"], section: "nuevo" },
    ]);
    assert.deepEqual(products[0]?.images, ["/original.jpg"]);
    assert.equal(products[1]?.image, "/portada.jpg");
    assert.deepEqual(products[1]?.images, ["/portada.jpg", "/detalle.jpg"]);
    assert.deepEqual(products[1]?.sizes, []);
    assert.deepEqual(products[1]?.colors, []);
    assert.equal(contentSchemas.products.safeParse([{ ...products[1], images: Array(6).fill("/foto.jpg") }]).success, false);
    assert.equal(contentSchemas.products.safeParse([{ ...products[1], sizes: ["M", "m"] }]).success, false);
  });

  it("normaliza estados heredados y valida los colores agotados", () => {
    const [product] = resolveContent("products", [{
      id: "vestido", name: "Vestido", category: "Vestidos", price: 100, image: "",
      colors: ["Azul", "Negro"], soldOutColors: ["Azul", "Retirado"], section: "nuevo",
    }]);
    assert.equal(product.soldOut, false);
    assert.deepEqual(product.soldOutColors, ["Azul"]);
    assert.equal(contentSchemas.products.safeParse([product]).success, true);
    assert.equal(contentSchemas.products.safeParse([{ ...product, soldOutColors: ["Retirado"] }]).success, false);
    assert.equal(contentSchemas.products.safeParse([{ ...product, soldOutColors: ["Azul", "Azul"] }]).success, false);
    assert.deepEqual(resolveContent("products", [{ ...product, soldOut: true }])[0]?.soldOutColors, ["Azul"]);
  });

  it("ubica al final los productos totalmente agotados sin alterar el orden elegido", () => {
    const base = { category: "Tops", image: "" };
    const products = [
      { ...base, id: "agotado", name: "A", price: 10, soldOut: true },
      { ...base, id: "parcial", name: "B", price: 20, colors: ["Azul", "Negro"], soldOutColors: ["Azul"] },
      { ...base, id: "sin-colores", name: "C", price: 30 },
      { ...base, id: "colores-agotados", name: "D", price: 40, colors: ["Azul", "Negro"], soldOutColors: ["Azul", "Negro"] },
    ];
    assert.equal(isProductSoldOut(products[1]), false);
    assert.equal(isProductSoldOut(products[2]), false);
    assert.equal(isProductSoldOut(products[3]), true);
    assert.deepEqual(sortProductsByAvailability(products).map((product) => product.id), ["parcial", "sin-colores", "agotado", "colores-agotados"]);
    assert.deepEqual(sortProductsByAvailability([...products].sort((a, b) => b.price - a.price)).map((product) => product.id), ["sin-colores", "parcial", "colores-agotados", "agotado"]);
    assert.deepEqual(products.map((product) => product.id), ["agotado", "parcial", "sin-colores", "colores-agotados"]);
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

  it("inicia las categorías destacadas vacías y conserva las seleccionadas", () => {
    assert.deepEqual(resolveContent("texts", {}).homeCategoryCards, []);
    const selected = [{ id: "tarjeta-uno", categoryId: "vestidos", img: "", hidden: false }];
    assert.deepEqual(resolveContent("texts", { homeCategoryCards: selected }).homeCategoryCards, selected);
    assert.deepEqual(resolveContent("texts", { homeCategoryCards: [] }).homeCategoryCards, []);
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
