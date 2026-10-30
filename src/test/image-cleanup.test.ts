import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Prisma } from "../generated/prisma/client";
import { queueChangedImages } from "../server/image-cleanup";

const imageUrl = "https://res.cloudinary.com/tienda/image/upload/v1/eterea/productos/imagenes/123e4567-e89b-12d3-a456-426614174000.jpg";

function fakeDb(referenced = false) {
  const calls: string[] = [];
  const table = (name: string) => ({
    findMany: async () => {
      calls.push(`${name}.findMany`);
      return name === "productImage" && referenced ? [{ url: imageUrl }] : [];
    },
    deleteMany: async () => { calls.push(`${name}.deleteMany`); },
    createMany: async () => { calls.push(`${name}.createMany`); },
  });
  const names = ["product", "productImage", "heroSlide", "curatedInstagramPost", "splitBanner",
    "editorialBanner", "homeCategoryCard", "cloudinaryCleanup", "cloudinaryPendingUpload"];
  const db = Object.fromEntries(names.map((name) => [name, table(name)])) as unknown as Prisma.TransactionClient;
  return { db, calls };
}

describe("Limpieza de imágenes al guardar", () => {
  it("no consulta tablas cuando no cambian imágenes", async () => {
    const { db, calls } = fakeDb();
    assert.equal(await queueChangedImages(db, []), 0);
    assert.deepEqual(calls, []);
  });

  it("pone en cola una imagen propia sin referencias", async () => {
    const { db, calls } = fakeDb();
    assert.equal(await queueChangedImages(db, [imageUrl, imageUrl]), 1);
    assert.equal(calls.filter((call) => call === "cloudinaryCleanup.createMany").length, 1);
    assert.ok(calls.includes("cloudinaryPendingUpload.deleteMany"));
  });

  it("conserva una imagen que todavía usa un producto", async () => {
    const { db, calls } = fakeDb(true);
    assert.equal(await queueChangedImages(db, [imageUrl]), 0);
    assert.ok(calls.includes("cloudinaryCleanup.deleteMany"));
    assert.ok(!calls.includes("cloudinaryCleanup.createMany"));
  });
});
