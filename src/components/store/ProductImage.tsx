"use client";

import type { CSSProperties } from "react";
import { PRODUCT_IMAGE_FALLBACK } from "@/lib/products";
import { responsiveCloudinaryImage } from "@/lib/cloudinary-media";
import { imageRatio, PRODUCT_COVER_RATIO, validCropSettings, type CropSettings, type ImageSettings } from "@/lib/image-presentation";

function customCropStyle(settings: CropSettings, ratio: number): CSSProperties {
  const baseScale = Math.max(1 / settings.width, 1 / (ratio * settings.height));
  const width = settings.width * baseScale * settings.zoom;
  const height = settings.height * baseScale * settings.zoom * ratio;
  return {
    position: "absolute",
    width: `${width * 100}%`,
    height: `${height * 100}%`,
    left: `${50 + settings.x * (width - 1) * 50}%`,
    top: `${50 + settings.y * (height - 1) * 50}%`,
    transform: "translate(-50%, -50%)",
  };
}

export function ProductImage({
  src,
  alt,
  className,
  style,
  loading,
  sizes = "100vw",
  width,
  height,
  fetchPriority,
  presentation,
  cover = false,
  cropRatio,
}: {
  src?: string | null;
  alt: string;
  className: string;
  style?: CSSProperties;
  loading?: "eager" | "lazy";
  sizes?: string;
  width?: number;
  height?: number;
  fetchPriority?: "high" | "low" | "auto";
  presentation?: ImageSettings | CropSettings | null;
  cover?: boolean;
  cropRatio?: number;
}) {
  const imageSrc = src?.trim() || PRODUCT_IMAGE_FALLBACK;
  const optimized = responsiveCloudinaryImage(imageSrc, presentation, cover, cropRatio);
  const localCrop = presentation && validCropSettings(presentation) ? presentation : null;
  const presentationRatio = cropRatio ?? (cover ? PRODUCT_COVER_RATIO : presentation && "format" in presentation
    ? imageRatio(presentation.format, presentation.width, presentation.height) : undefined);
  const cropStyle = !optimized.srcSet && localCrop && presentationRatio
    ? customCropStyle(localCrop, presentationRatio) : undefined;

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
      style={cropStyle ? { ...cropStyle, ...style } : style}
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
