import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { instagramMediaAsset } from "../lib/instagram-media";

const videoUrl = "https://scontent.cdninstagram.com/v/video.mp4?token=example";
const thumbnailUrl = "https://scontent.xx.fbcdn.net/v/cover.jpg?token=example";

describe("Archivos de publicaciones propias de Instagram", () => {
  it("identifica portadas de publicaciones IMAGE", () => {
    assert.deepEqual(instagramMediaAsset({ media_type: "IMAGE", media_url: "https://scontent.cdninstagram.com/v/photo.jpg" }), {
      imageUrl: "https://scontent.cdninstagram.com/v/photo.jpg",
    });
  });

  it("identifica el video y su portada sin exponer el token", () => {
    assert.deepEqual(instagramMediaAsset({ media_type: "VIDEO", media_url: videoUrl, thumbnail_url: thumbnailUrl }), {
      videoUrl,
      posterUrl: thumbnailUrl,
    });
  });

  it("usa thumbnail_url para publicaciones de tipo REELS", () => {
    assert.deepEqual(instagramMediaAsset({ media_type: "REELS", media_url: videoUrl, thumbnail_url: thumbnailUrl }), {
      videoUrl,
      posterUrl: thumbnailUrl,
    });
  });

  it("usa la primera imagen disponible como portada de un carrusel", () => {
    assert.deepEqual(instagramMediaAsset({ media_type: "CAROUSEL_ALBUM", children: { data: [
      { media_type: "IMAGE", media_url: "https://scontent.cdninstagram.com/v/photo.jpg" },
      { media_type: "VIDEO", media_url: videoUrl },
    ] } }), { imageUrl: "https://scontent.cdninstagram.com/v/photo.jpg" });
  });

  it("conserva la portada de un video aunque Meta no entregue el archivo", () => {
    assert.deepEqual(instagramMediaAsset({ media_type: "VIDEO", thumbnail_url: thumbnailUrl }), { posterUrl: thumbnailUrl });
    assert.deepEqual(instagramMediaAsset({ media_type: "CAROUSEL_ALBUM", children: { data: [
      { media_type: "VIDEO", media_url: videoUrl },
      { media_type: "IMAGE", media_url: "https://scontent.cdninstagram.com/v/photo.jpg" },
    ] } }), { imageUrl: "https://scontent.cdninstagram.com/v/photo.jpg" });
  });

  it("rechaza archivos externos y publicaciones sin URL de media", () => {
    assert.equal(instagramMediaAsset({ media_type: "VIDEO", media_url: "https://cdninstagram.com.evil.test/video.mp4" }), null);
    assert.equal(instagramMediaAsset({ media_type: "VIDEO" }), null);
    assert.equal(instagramMediaAsset({ media_type: "VIDEO", media_url: "http://scontent.cdninstagram.com/video.mp4" }), null);
  });
});
