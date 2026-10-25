import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { instagramMediaAsset } from "../lib/instagram-media";

const videoUrl = "https://scontent.cdninstagram.com/v/video.mp4?token=example";
const thumbnailUrl = "https://scontent.xx.fbcdn.net/v/cover.jpg?token=example";

describe("Archivos de publicaciones propias de Instagram", () => {
  it("prepara videos y portadas para reproducirlos sin iniciar sesión", () => {
    assert.deepEqual(instagramMediaAsset({ media_type: "VIDEO", media_url: videoUrl, thumbnail_url: thumbnailUrl }), {
      videoUrl,
      posterUrl: thumbnailUrl,
    });
  });

  it("encuentra el video dentro de un carrusel", () => {
    assert.deepEqual(instagramMediaAsset({ media_type: "CAROUSEL_ALBUM", children: { data: [
      { media_type: "IMAGE", media_url: "https://scontent.cdninstagram.com/v/photo.jpg" },
      { media_type: "VIDEO", media_url: videoUrl },
    ] } }), { videoUrl, posterUrl: undefined });
  });

  it("rechaza archivos externos y publicaciones sin URL de media", () => {
    assert.equal(instagramMediaAsset({ media_type: "VIDEO", media_url: "https://cdninstagram.com.evil.test/video.mp4" }), null);
    assert.equal(instagramMediaAsset({ media_type: "VIDEO" }), null);
    assert.equal(instagramMediaAsset({ media_type: "VIDEO", media_url: "http://scontent.cdninstagram.com/video.mp4" }), null);
  });
});
