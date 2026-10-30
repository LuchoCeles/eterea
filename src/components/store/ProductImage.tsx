"use client";

import { PRODUCT_IMAGE_FALLBACK } from "@/lib/products";
import { responsiveCloudinaryImage } from "@/lib/cloudinary-media";
import type { CropSettings, ImageSettings } from "@/lib/image-presentation";

export function ProductImage({
  src,
  alt,
  className,
  loading,
  sizes = "100vw",
  width,
  height,
  fetchPriority,
  presentation,
  cover = false,
}: {
  src?: string | null;
  alt: string;
  className: string;
  loading?: "eager" | "lazy";
  sizes?: string;
  width?: number;
  height?: number;
  fetchPriority?: "high" | "low" | "auto";
  presentation?: ImageSettings | CropSettings | null;
  cover?: boolean;
}) {
  const imageSrc = src?.trim() || PRODUCT_IMAGE_FALLBACK;
  const optimized = responsiveCloudinaryImage(imageSrc, presentation, cover);

  return (
    <img
      key={imageSrc}
      src={optimized.src}
      srcSet={optimized.srcSet}
      sizes={optimized.srcSet ? sizes : undefined}
      alt={alt}
      draggable={false}
      loading={loading}
      width={width}
      height={height}
      fetchPriority={fetchPriority}
      className={className}
      data-fallback-applied={imageSrc === PRODUCT_IMAGE_FALLBACK ? "true" : undefined}
      onError={(event) => {
        const image = event.currentTarget;
        if (image.dataset.fallbackApplied === "true") return;
        if (optimized.srcSet && image.dataset.originalTried !== "true") {
          image.dataset.originalTried = "true";
          image.srcset = "";
          image.src = imageSrc;
          return;
        }
        image.dataset.fallbackApplied = "true";
        image.src = PRODUCT_IMAGE_FALLBACK;
      }}
    />
  );
}
