import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { defaults } from "../lib/content";
import { loadRelationalContentWithSections, saveRelationalContent, updateRelationalHeroSlide } from "../server/relational-content";

type ContentDb = Parameters<typeof loadRelationalContentWithSections>[0];

function dbWithRows(rows: Record<string, unknown>) {
  const calls: string[] = [];
  const db = new Proxy({}, {
    get(_target, table: string) {
      if (!(table in rows)) throw new Error(`Se consultó una tabla sin sección guardada: ${table}`);
      return new Proxy({}, {
        get(_model, operation: string) {
          calls.push(`${table}.${operation}`);
          return async () => rows[table];
        },
      });
    },
  }) as ContentDb;
  return { db, calls };
}

describe("Lectura relacional según ContentSection", () => {
  it("consulta solo las tablas guardadas y completa textos anidados con valores por defecto", async () => {
    const { db, calls } = dbWithRows({
      contentSection: [{ key: "homeSections" }],
      homeSectionSetting: [{ section: "hero", enabled: false }],
    });
    const result = await loadRelationalContentWithSections(db);
    assert.deepEqual(calls, ["contentSection.findMany", "homeSectionSetting.findMany"]);
    assert.equal(result.content.texts.homeSections.hero, false);
    assert.equal(result.content.texts.homeSections.instagram, defaults.texts.homeSections.instagram);
    assert.deepEqual(result.content.texts.offers, defaults.texts.offers);
    assert.deepEqual(result.content.hero, defaults.hero);
  });

  it("conserva una lista promocional guardada vacía", async () => {
    const { db, calls } = dbWithRows({
      contentSection: [{ key: "promo" }],
      promoLine: [],
    });
    const result = await loadRelationalContentWithSections(db);
    assert.deepEqual(calls, ["contentSection.findMany", "promoLine.findMany"]);
    assert.deepEqual(result.content.promo, []);
  });

  it("lee encuadres independientes y conserva banners heredados sin ajuste", async () => {
    const crop = { zoom: 1.5, x: 0.2, y: -0.3, width: 1600, height: 900 };
    const row = {
      id: 8, img: "/banner.jpg", productId: null, kicker: "", title: "Colección", cta: "Entrá",
      promo: "", align: "left", desktopZoom: crop.zoom, desktopX: crop.x,
      desktopY: crop.y, desktopWidth: crop.width, desktopHeight: crop.height,
      mobileZoom: null, mobileX: null, mobileY: null, mobileWidth: null, mobileHeight: null,
    };
    const { db } = dbWithRows({ contentSection: [{ key: "hero" }], heroSlide: [row, {
      ...row, desktopZoom: null, desktopX: null, desktopY: null,
      desktopWidth: null, desktopHeight: null,
    }] });
    const result = await loadRelationalContentWithSections(db);
    assert.deepEqual(result.content.hero[0].desktopSettings, crop);
    assert.equal(result.content.hero[0].id, 8);
    assert.equal(result.content.hero[0].mobileSettings, undefined);
    assert.equal(result.content.hero[1].desktopSettings, undefined);
  });
});

it("guarda ambos encuadres del banner en columnas tipadas", async () => {
  let created: unknown;
  const db = {
    heroSlide: {
      deleteMany: async () => undefined,
      createMany: async (args: unknown) => { created = args; },
    },
    contentSection: { upsert: async () => undefined },
  } as unknown as ContentDb;
  const slide = { ...defaults.hero[0],
    desktopSettings: { zoom: 1.2, x: 0.3, y: 0, width: 1600, height: 900 },
    mobileSettings: { zoom: 1.8, x: -0.4, y: 0.5, width: 1600, height: 900 },
  };
  await saveRelationalContent(db, "hero", [slide]);
  const rows = created as { data: Record<string, unknown>[] };
  assert.deepEqual(rows.data[0], {
    id: undefined, position: 0, img: slide.img, productId: null, kicker: slide.kicker,
    title: slide.title, cta: slide.cta, promo: slide.promo, align: slide.align,
    desktopZoom: 1.2, desktopX: 0.3, desktopY: 0,
    desktopWidth: 1600, desktopHeight: 900,
    mobileZoom: 1.8, mobileX: -0.4, mobileY: 0.5,
    mobileWidth: 1600, mobileHeight: 900,
  });
});

it("actualiza únicamente el banner identificado y rechaza una lista que cambió", async () => {
  const calls: string[] = [];
  let updated: { where: { id: number }; data: Record<string, unknown> } | undefined;
  const db = {
    heroSlide: {
      findMany: async () => [{ id: 4, img: "/uno.jpg" }, { id: 5, img: "/dos.jpg" }],
      update: async (args: typeof updated) => { calls.push("update"); updated = args; },
      deleteMany: async () => { calls.push("deleteMany"); },
      createMany: async () => { calls.push("createMany"); },
    },
  } as unknown as ContentDb;
  const slide = { ...defaults.hero[0], id: 5, title: "Dos editado" };
  assert.equal(await updateRelationalHeroSlide(db, 1, slide), "/dos.jpg");
  assert.deepEqual(calls, ["update"]);
  assert.equal(updated?.where.id, 5);
  assert.equal(updated?.data.title, "Dos editado");
  assert.equal(await updateRelationalHeroSlide(db, 0, slide), null);
  assert.deepEqual(calls, ["update"]);
});
