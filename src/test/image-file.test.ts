import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateImageFile } from "../lib/image-file";

function file(bytes: number[] | Buffer, type: string) {
  return new File([Uint8Array.from(bytes)], "foto", { type });
}

describe("Validación binaria de imágenes", () => {
  const cases: [string, number[] | Buffer][] = [
    ["image/jpeg", [0xff, 0xd8, 0xff, 0xd9]],
    ["image/png", [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
    ["image/gif", Buffer.from("GIF89a")],
    ["image/webp", Buffer.from("RIFF\x00\x00\x00\x00WEBPVP8 ")],
    ["image/avif", Buffer.from([0, 0, 0, 24, ...Buffer.from("ftypavif"), 0, 0, 0, 0, ...Buffer.from("mif1avif")])],
  ];

  for (const [type, bytes] of cases) {
    it(`reconoce la cabecera ${type}`, async () => {
      await assert.doesNotReject(() => validateImageFile(file(bytes, type)));
    });
  }

  it("rechaza un MIME declarado que no coincide con los bytes", async () => {
    await assert.rejects(() => validateImageFile(file(cases[1][1], "image/jpeg")), /contenido del archivo/);
    await assert.rejects(() => validateImageFile(file(Buffer.from("<svg onload=alert(1)>"), "image/png")), /contenido del archivo/);
  });

  it("rechaza archivos truncados, MIME desconocido y tamaños excesivos", async () => {
    await assert.rejects(() => validateImageFile(file([0xff, 0xd8], "image/jpeg")), /contenido del archivo/);
    await assert.rejects(() => validateImageFile(file([1, 2, 3], "image/svg+xml")), /debe ser una imagen/);
    const huge = { type: "image/png", size: 50_000_001 } as File;
    await assert.rejects(() => validateImageFile(huge), /50 MB/);
  });
});
