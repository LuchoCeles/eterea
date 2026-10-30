"use client";

import { useEffect, useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ProductImage } from "@/components/store/ProductImage";
import type { ImageSettings } from "@/lib/image-presentation";

type ProductImageLightboxProps = {
  images: string[];
  imageSettings?: (ImageSettings | null)[];
  productName: string;
  initialImage: number;
  onOpenChange: (open: boolean) => void;
};

function clickedOutsidePhoto(image: HTMLImageElement, x: number, y: number) {
  const { naturalWidth, naturalHeight } = image;
  if (!naturalWidth || !naturalHeight) return true;

  const bounds = image.getBoundingClientRect();
  const scale = Math.min(bounds.width / naturalWidth, bounds.height / naturalHeight);
  const width = naturalWidth * scale;
  const height = naturalHeight * scale;
  const left = bounds.left + (bounds.width - width) / 2;
  const top = bounds.top + (bounds.height - height) / 2;
  return x < left || x > left + width || y < top || y > top + height;
}

export function ProductImageLightbox({
  images,
  imageSettings,
  productName,
  initialImage,
  onOpenChange,
}: ProductImageLightboxProps) {
  const [activeImage, setActiveImage] = useState(initialImage);
  const [carouselRef, carouselApi] = useEmblaCarousel({
    loop: images.length > 1,
    startIndex: initialImage,
    duration: 32,
  });
  const imageCount = images.length;

  useEffect(() => {
    if (!carouselApi) return;
    const syncImage = () => setActiveImage(carouselApi.selectedScrollSnap());
    carouselApi.on("select", syncImage);
    carouselApi.on("reInit", syncImage);
    return () => {
      carouselApi.off("select", syncImage);
      carouselApi.off("reInit", syncImage);
    };
  }, [carouselApi]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (imageCount < 2) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      if (event.key === "ArrowLeft") carouselApi?.scrollPrev();
      else carouselApi?.scrollNext();
    }
  }

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    const target = event.target;
    if (
      target instanceof HTMLImageElement &&
      clickedOutsidePhoto(target, event.clientX, event.clientY)
    ) {
      onOpenChange(false);
    } else if (target instanceof HTMLElement && target.dataset.lightboxBackdrop === "true") {
      onOpenChange(false);
    }
  }

  return (
    <DialogPrimitive.Root open onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70" />
        <DialogPrimitive.Content
          onKeyDown={handleKeyDown}
          onClick={handleBackdropClick}
          data-lightbox-backdrop="true"
          className="fixed inset-0 z-50 flex flex-col text-white outline-none"
        >
          <DialogPrimitive.Title className="sr-only">Fotos de {productName}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Para cerrar, presioná Escape o hacé clic fuera de la foto.
          </DialogPrimitive.Description>
          <div
            data-lightbox-backdrop="true"
            className="relative z-10 flex h-12 shrink-0 items-center justify-center bg-black/85 px-14 text-sm sm:h-14"
          >
            <span aria-live="polite" aria-atomic="true">
              {activeImage + 1} / {imageCount}
            </span>
          </div>

          <div data-lightbox-backdrop="true" className="relative min-h-0 flex-1 py-3 sm:py-4">
            <div
              ref={carouselRef}
              data-lightbox-backdrop="true"
              className="h-full w-full touch-pan-y overflow-hidden"
            >
              <div className="flex h-full gap-5 sm:gap-0">
                {images.map((src, index) => (
                  <div
                    key={`${src}-${index}`}
                    data-lightbox-backdrop="true"
                    role="group"
                    aria-roledescription="diapositiva"
                    aria-label={`Foto ${index + 1} de ${imageCount}`}
                    aria-hidden={index !== activeImage}
                    className="flex h-full min-w-0 flex-[0_0_100%] items-center justify-center px-4 sm:px-28"
                  >
                    <ProductImage
                      src={src}
                      presentation={imageSettings?.[index]}
                      alt={`${productName}, foto ${index + 1} de ${imageCount}`}
                      loading="eager"
                      sizes="100vw"
                      className="h-full w-full select-none object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {imageCount > 1 && (
            <>
              <button
                type="button"
                aria-label="Foto anterior"
                onClick={() => carouselApi?.scrollPrev()}
                className="absolute left-12 top-1/2 z-10 hidden h-14 w-16 -translate-y-1/2 items-center justify-center transition-colors hover:bg-black/30 focus-visible:outline-2 focus-visible:outline-white sm:flex"
              >
                <ArrowLeft className="h-7 w-7" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                aria-label="Foto siguiente"
                onClick={() => carouselApi?.scrollNext()}
                className="absolute right-12 top-1/2 z-10 hidden h-14 w-16 -translate-y-1/2 items-center justify-center transition-colors hover:bg-black/30 focus-visible:outline-2 focus-visible:outline-white sm:flex"
              >
                <ArrowRight className="h-7 w-7" strokeWidth={1.5} />
              </button>
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
