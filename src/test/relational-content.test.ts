import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { defaults } from "../lib/content";
import { loadRelationalContentWithSections } from "../server/relational-content";

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
});
