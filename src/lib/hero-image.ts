import type { CSSProperties } from "react";
import type { CropSettings } from "@/lib/image-presentation";

// Los tamaños de referencia siguen las proporciones de la sección Hero en cada pantalla.
export const HERO_DESKTOP_RATIO = 1440 / 648;
export const HERO_MOBILE_RATIO = 390 / 608;

export function heroPreviewRatio(screen: "desktop" | "mobile", viewportWidth: number, viewportHeight: number) {
  const activeScreen = screen === "desktop" ? viewportWidth >= 768 : viewportWidth < 768;
  if (!activeScreen) return screen === "desktop" ? HERO_DESKTOP_RATIO : HERO_MOBILE_RATIO;
  const heroHeight = Math.max(510, Math.min(820, viewportHeight * 0.72));
  return viewportWidth / heroHeight;
}

export function heroImageStyle(settings: CropSettings | null | undefined, fallbackX = 0): CSSProperties {
  const zoom = settings?.zoom ?? 1;
  const x = settings?.x ?? fallbackX;
  const y = settings?.y ?? 0;
  return {
    width: `${zoom * 100}%`,
    height: `${zoom * 100}%`,
    left: `${50 + x * (zoom - 1) * 50}%`,
    top: `${50 + y * (zoom - 1) * 50}%`,
    objectPosition: `${(1 - x) * 50}% ${(1 - y) * 50}%`,
    transform: "translate(-50%, -50%)",
  };
}

export function legacyMobileImageX(align: "left" | "right") {
  return align === "right" ? 0.44 : -0.34;
}
