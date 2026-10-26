import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { groupProductRelations, type ProductRelationRow } from "../lib/product-relations";

function row(kind: string, position: number, value: string, price: unknown = null, rowId = ""): ProductRelationRow {
  return { productId: "prenda", kind, position, value, price, rowId };
}

describe("Relaciones de productos", () => {
  it("reconstruye galería, opciones y precios en el mismo orden que Prisma", () => {
    const groups = groupProductRelations([
      row("payment", 1, "Tarjeta", "110.50", "precio-b"),
      row("image", 1, "/segunda.jpg"),
      row("size", 1, "M"),
      row("color", 0, "Azul"),
      row("payment", 0, "Transferencia", "90.00", "precio-a"),
      row("image", 0, "/portada.jpg"),
      row("size", 0, "S"),
    ]);
    assert.deepEqual(groups.get("prenda"), {
      images: ["/portada.jpg", "/segunda.jpg"],
      sizes: ["S", "M"], colors: ["Azul"],
      paymentPrices: [{ label: "Transferencia", price: 90 }, { label: "Tarjeta", price: 110.5 }],
    });
  });

  it("ordena precios con igual posición por ID y rechaza importes inválidos", () => {
    const groups = groupProductRelations([
      row("payment", 0, "B", 120, "b"), row("payment", 0, "A", 100, "a"),
    ]);
    assert.deepEqual(groups.get("prenda")?.paymentPrices.map((item) => item.label), ["A", "B"]);
    assert.throws(() => groupProductRelations([row("payment", 0, "Invalido", null)]));
  });
});
