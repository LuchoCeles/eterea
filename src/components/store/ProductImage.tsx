import { PRODUCT_IMAGE_FALLBACK } from "@/lib/products";

export function ProductImage({
  src,
  alt,
  className,
  loading,
}: {
  src?: string | null;
  alt: string;
  className: string;
  loading?: "eager" | "lazy";
}) {
  const imageSrc = src?.trim() || PRODUCT_IMAGE_FALLBACK;

  return (
    <img
      src={imageSrc}
      alt={alt}
      loading={loading}
      className={className}
      data-fallback-applied={imageSrc === PRODUCT_IMAGE_FALLBACK ? "true" : undefined}
      onError={(event) => {
        const image = event.currentTarget;
        if (image.dataset.fallbackApplied === "true") return;
        image.dataset.fallbackApplied = "true";
        image.src = PRODUCT_IMAGE_FALLBACK;
      }}
    />
  );
}
