import assert from "node:assert/strict";
import { it } from "node:test";
import { responsiveCloudinaryImage } from "../lib/cloudinary-media";
import { PRODUCT_COVER_RATIO, cropRegion, editableImageFormats, imageRatio, needsCoverConfirmation } from "../lib/image-presentation";
import { contentSchemas } from "../lib/content-schema";

const url = "https://res.cloudinary.com/eterea-demo/image/upload/v1761000000/eterea/productos/imagenes/123e4567-e89b-12d3-a456-426614174000.jpg";
const base = { width: 2400, height: 1600, zoom: 1, x: 0, y: 0 };

it("fija la proporción cuadrada para editar fotos de producto", () => {
  assert.deepEqual(editableImageFormats, ["1:1"]);
  assert.equal(imageRatio("original", base.width, base.height), 3 / 2);
  assert.equal(imageRatio("1:1", base.width, base.height), 1);
});

it("conserva la entrega anterior cuando una imagen no tiene encuadre", () => {
  assert.equal(responsiveCloudinaryImage(url).src,
    url.replace("/image/upload/", "/image/upload/f_auto,q_auto,c_limit,w_960/"));
});

it("separa el formato de galería del encuadre de portada", () => {
  const gallery = { ...base, format: "1:1" as const, zoom: 1.5, x: -0.4, y: 0.2 };
  const cover = { ...base, zoom: 2, x: 0.8, y: -0.6 };
  const galleryUrl = responsiveCloudinaryImage(url, gallery).src;
  const coverUrl = responsiveCloudinaryImage(url, cover, true).src;
  assert.notEqual(galleryUrl, coverUrl);
  assert.match(galleryUrl, /c_crop,/);
  assert.match(coverUrl, /c_crop,/);
  const [, cropWidth, cropHeight] = coverUrl.match(/c_crop,[^/]*w_(\d+),h_(\d+)/) ?? [];
  assert.equal(Number(cropWidth) / Number(cropHeight), PRODUCT_COVER_RATIO);
  const galleryRegion = cropRegion(gallery, imageRatio(gallery.format, gallery.width, gallery.height));
  assert.ok(Math.abs(galleryRegion.width / galleryRegion.height
    * gallery.width / gallery.height - 1) < 1e-10);
  const coverRegion = cropRegion(cover, PRODUCT_COVER_RATIO);
  assert.ok(Math.abs(coverRegion.width / coverRegion.height * cover.width / cover.height - PRODUCT_COVER_RATIO) < 1e-10);
});

it("acepta una portada 4:5 directa y limita parámetros manipulados", () => {
  const directCover = responsiveCloudinaryImage(url, { width: 1200, height: 1500, zoom: 1, x: 0, y: 0 }, true).src;
  assert.doesNotMatch(directCover, /c_crop,/);
  assert.equal(needsCoverConfirmation("anterior", "nueva", null), true);
  assert.equal(needsCoverConfirmation("anterior", "anterior", null), false);
  assert.equal(needsCoverConfirmation("anterior", "nueva", base), false);
  const product = {
    id: "uno", name: "Prenda", category: "Vestidos", categoryId: "vestidos", price: 100,
    section: null, image: url, images: [url],
    imageSettings: [{ ...base, format: "1:1" }],
    coverSettings: { ...base, zoom: 1, x: 0, y: 0 },
  };
  assert.equal(contentSchemas.products.safeParse([product]).success, true);
  assert.equal(contentSchemas.products.safeParse([{ ...product, coverSettings: { ...base, zoom: 0.5 } }]).success, false);
  assert.equal(contentSchemas.products.safeParse([{ ...product, coverSettings: { ...base, width: 3 } }]).success, false);
  assert.equal(contentSchemas.products.safeParse([{ ...product, imageSettings: [] }]).success, false);
  assert.equal(contentSchemas.products.safeParse([{ ...product, image: "/foto-privada", images: ["/foto-privada"] }]).success, false);
});
