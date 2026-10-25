import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { destroyCloudinaryAsset } from "../lib/cloudinary-api";
import { parseCloudinaryAssetUrl, planCloudinaryDeletions } from "../lib/cloudinary-media";

const image = "https://res.cloudinary.com/eterea-demo/image/upload/v1761000000/eterea/productos/imagenes/123e4567-e89b-12d3-a456-426614174000.jpg";

describe("Gestión de imágenes de Cloudinary", () => {
  it("extrae el public_id de las URLs propias con estructura por sección", () => {
    assert.deepEqual(parseCloudinaryAssetUrl(image, "eterea"), {
      cloudName: "eterea-demo",
      publicId: "eterea/productos/imagenes/123e4567-e89b-12d3-a456-426614174000",
    });
    assert.equal(parseCloudinaryAssetUrl(image.replace("/productos/", "/inicio/"), "eterea")?.publicId,
      "eterea/inicio/imagenes/123e4567-e89b-12d3-a456-426614174000");
  });

  it("rechaza URLs externas, parámetros y rutas fuera de la carpeta del proyecto", () => {
    assert.equal(parseCloudinaryAssetUrl("https://example.com/image.jpg", "eterea"), null);
    assert.equal(parseCloudinaryAssetUrl(`${image}?q=auto`, "eterea"), null);
    assert.equal(parseCloudinaryAssetUrl(image.replace("eterea/productos", "otro/prod"), "eterea"), null);
  });

  it("borra solo URLs propias sin referencias y evita duplicados", () => {
    assert.deepEqual(planCloudinaryDeletions([image, image, "https://example.com/other.jpg"], [], "eterea"), [image]);
    assert.deepEqual(planCloudinaryDeletions([image], [image], "eterea"), []);
  });

  it("envía a Cloudinary el public_id sin extensión e invalida su caché al borrar", async () => {
    let requestUrl = "";
    let requestInit: RequestInit | undefined;
    const request: typeof fetch = async (input, init) => {
      requestUrl = String(input);
      requestInit = init;
      return Response.json({ result: "ok" });
    };
    await destroyCloudinaryAsset("https://api.cloudinary.com/v1_1/eterea-demo/image/destroy", "Basic token", "eterea/productos/imagenes/123e4567-e89b-12d3-a456-426614174000", request);
    assert.equal(requestUrl, "https://api.cloudinary.com/v1_1/eterea-demo/image/destroy");
    assert.equal(requestInit?.method, "POST");
    assert.equal(new Headers(requestInit?.headers).get("authorization"), "Basic token");
    assert.equal((requestInit?.body as FormData).get("public_id"), "eterea/productos/imagenes/123e4567-e89b-12d3-a456-426614174000");
    assert.equal((requestInit?.body as FormData).get("invalidate"), "true");
  });

  it("considera una imagen inexistente como ya eliminada y conserva los errores del proveedor", async () => {
    const alreadyDeleted: typeof fetch = async () => Response.json({ result: "not found" });
    await assert.doesNotReject(() => destroyCloudinaryAsset("https://api.cloudinary.com/destroy", "Basic token", "eterea/productos/imagenes/123", alreadyDeleted));
    const failed: typeof fetch = async () => Response.json({ result: "error" }, { status: 401 });
    await assert.rejects(() => destroyCloudinaryAsset("https://api.cloudinary.com/destroy", "Basic token", "eterea/productos/imagenes/123", failed), /Cloudinary no pudo borrar/);
  });
});
