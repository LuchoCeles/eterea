import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { HomeCategoryCard } from "../lib/content";
import { saveHomeCategoryCardRows } from "../server/home-category-cards";

type Row = { id: string; categoryId: string; productId: string | null; img: string; hidden: boolean; position: number };

function card(id: string, categoryId: string): HomeCategoryCard {
  return { id, categoryId, img: "", hidden: false };
}

function fakeDb(initial: Row[]) {
  const rows = new Map(initial.map((row) => [row.id, row]));
  const operations: string[] = [];
  let reads = 0;
  const homeCategoryCard = {
    async findMany() { reads += 1; return [...rows.values()]; },
    async deleteMany({ where }: { where: { id: { in: string[] } } }) {
      for (const id of where.id.in) rows.delete(id);
      operations.push("delete");
    },
    async upsert({ where, create, update }: { where: { id: string }; create: Row; update: Omit<Row, "id"> }) {
      const row = rows.has(where.id) ? { id: where.id, ...update } : create;
      if ([...rows.values()].some((other) => other.id !== row.id && other.categoryId === row.categoryId)) {
        throw new Error("HomeCategoryCard_categoryId_key");
      }
      rows.set(row.id, row);
      operations.push("upsert");
    },
  };
  return { db: { homeCategoryCard } as unknown as Parameters<typeof saveHomeCategoryCardRows>[0], rows, operations,
    reads: () => reads };
}

describe("Guardado de categorías destacadas", () => {
  it("libera la categoría anterior antes de reemplazar la tarjeta", async () => {
    const { db, rows, operations } = fakeDb([{
      id: "heredada", categoryId: "vestidos", productId: null, img: "", hidden: true, position: 0,
    }]);

    await saveHomeCategoryCardRows(db, [card("nueva", "vestidos")]);

    assert.deepEqual(operations, ["delete", "upsert"]);
    assert.deepEqual([...rows.values()], [{
      id: "nueva", categoryId: "vestidos", productId: null, img: "", hidden: false, position: 0,
    }]);
  });

  it("permite intercambiar categorías y actualizar el orden", async () => {
    const { db, rows, operations } = fakeDb([
      { id: "primera", categoryId: "vestidos", productId: null, img: "", hidden: false, position: 0 },
      { id: "segunda", categoryId: "tops", productId: null, img: "", hidden: false, position: 1 },
    ]);

    await saveHomeCategoryCardRows(db, [card("primera", "tops"), card("segunda", "vestidos")]);

    assert.deepEqual(operations, ["delete", "upsert", "upsert"]);
    assert.deepEqual([...rows.values()].map((row) => [row.id, row.categoryId, row.position]), [
      ["primera", "tops", 0], ["segunda", "vestidos", 1],
    ]);
  });

  it("guarda una nueva posición y omite filas sin cambios", async () => {
    const { db, rows, operations } = fakeDb([
      { id: "primera", categoryId: "vestidos", productId: null, img: "", hidden: false, position: 0 },
      { id: "segunda", categoryId: "tops", productId: null, img: "", hidden: false, position: 1 },
    ]);

    await saveHomeCategoryCardRows(db, [card("segunda", "tops"), card("primera", "vestidos")]);
    assert.deepEqual(operations, ["upsert", "upsert"]);
    assert.equal(rows.get("segunda")?.position, 0);
    operations.length = 0;
    await saveHomeCategoryCardRows(db, [card("segunda", "tops"), card("primera", "vestidos")]);
    assert.deepEqual(operations, []);
  });

  it("reutiliza las filas ya leídas al guardar el contenido completo", async () => {
    const current = [{ id: "primera", categoryId: "vestidos", productId: null,
      img: "/portada.jpg", hidden: false, position: 2 }];
    const { db, rows, operations, reads } = fakeDb(current);
    await saveHomeCategoryCardRows(db, [{ ...card("primera", "vestidos"), img: "/portada.jpg" }], current);
    assert.equal(reads(), 0);
    assert.deepEqual(operations, ["upsert"]);
    assert.equal(rows.get("primera")?.position, 0);
  });
});
