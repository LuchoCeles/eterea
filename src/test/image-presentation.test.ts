import assert from "node:assert/strict";
import { it } from "node:test";
import { responsiveCloudinaryImage } from "../lib/cloudinary-media";
import { PRODUCT_COVER_RATIO, cropRegion, editableImageFormats, imageRatio, needsCoverConfirmation } from "../lib/image-presentation";
import { contentSchemas } from "../lib/content-schema";
import { HERO_DESKTOP_RATIO, HERO_MOBILE_RATIO, heroImageStyle, heroPreviewRatio, legacyMobileImageX } from "../lib/hero-image";
import { mergeHeroDraft } from "../lib/hero-draft-client";

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

it("separa los encuadres del banner y conserva los banners anteriores", () => {
  const slide = { img: url, kicker: "Colección", title: "Etérea", cta: "Entrá", promo: "", align: "left" };
  assert.equal(contentSchemas.hero.safeParse([slide]).success, true);
  assert.equal(contentSchemas.hero.safeParse([{ ...slide, id: 12 }]).success, true);
  assert.equal(contentSchemas.hero.safeParse([{ ...slide, img: "local-banner:123e4567-e89b-12d3-a456-426614174000" }]).success, false);
  assert.equal(contentSchemas.hero.safeParse([{
    ...slide, desktopSettings: { ...base, zoom: 1.4, x: 0.2 },
    mobileSettings: { ...base, zoom: 2, y: -0.6 },
  }]).success, true);
  assert.equal(contentSchemas.hero.safeParse([{
    ...slide, mobileSettings: { ...base, x: 1.1 },
  }]).success, false);
  assert.ok(HERO_DESKTOP_RATIO > 2);
  assert.ok(HERO_MOBILE_RATIO < 1);
  assert.equal(heroPreviewRatio("desktop", 1024, 900), 1024 / 648);
  assert.equal(heroPreviewRatio("mobile", 390, 844), 390 / (844 * 0.72));
  assert.equal(heroPreviewRatio("desktop", 390, 844), HERO_DESKTOP_RATIO);
  assert.deepEqual(heroImageStyle({ ...base, zoom: 2, x: 1, y: -1 }), {
    width: "200%", height: "200%", left: "100%", top: "0%",
    objectPosition: "0% 100%", transform: "translate(-50%, -50%)",
  });
  assert.ok(Math.abs(Number.parseFloat(heroImageStyle(null, legacyMobileImageX("right")).objectPosition!) - 28) < 0.001);
});

it("integra el banner guardado sin perder los cambios pendientes de otro", () => {
  const saved = [
    { img: "/uno.jpg", kicker: "", title: "Uno", cta: "Ver", promo: "", align: "left" as const },
    { img: "/dos.jpg", kicker: "", title: "Dos", cta: "Ver", promo: "", align: "right" as const },
  ];
  const marker = "local-banner:123e4567-e89b-12d3-a456-426614174000";
  const current = [{ ...saved[0], img: marker }, { ...saved[1], title: "Dos editado" }];
  const server = [{ ...saved[0], id: 4, img: "/subida.jpg" }, { ...saved[1], id: 5 }];
  const merged = mergeHeroDraft(saved, current, server, new Map([[marker, "/subida.jpg"]]));
  assert.deepEqual(merged[0], server[0]);
  assert.deepEqual(merged[1], { ...current[1], id: 5 });
});
