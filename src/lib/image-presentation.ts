export const imageFormats = ["original", "16:9", "21:9", "4:3", "1:1", "4:5", "9:16"] as const;
export type ImageFormat = (typeof imageFormats)[number];

export type CropSettings = {
  zoom: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ImageSettings = CropSettings & { format: ImageFormat };

const ratios: Record<Exclude<ImageFormat, "original">, number> = {
  "16:9": 16 / 9,
  "21:9": 21 / 9,
  "4:3": 4 / 3,
  "1:1": 1,
  "4:5": 4 / 5,
  "9:16": 9 / 16,
};

export function imageRatio(format: ImageFormat, width: number, height: number) {
  return format === "original" ? width / height : ratios[format];
}

export function cropRegion(settings: CropSettings, ratio: number) {
  const { width, height, zoom, x, y } = settings;
  const baseWidth = Math.min(width, height * ratio);
  const baseHeight = baseWidth / ratio;
  const cropWidth = baseWidth / zoom;
  const cropHeight = baseHeight / zoom;
  return {
    left: ((width - cropWidth) * (1 - x)) / (2 * width),
    top: ((height - cropHeight) * (1 - y)) / (2 * height),
    width: cropWidth / width,
    height: cropHeight / height,
  };
}

export function validCropSettings(value: CropSettings) {
  return Number.isInteger(value.width) && value.width > 0 && value.width <= 30000
    && Number.isInteger(value.height) && value.height > 0 && value.height <= 30000
    && Number.isFinite(value.zoom) && value.zoom >= 1 && value.zoom <= 3
    && Number.isFinite(value.x) && value.x >= -1 && value.x <= 1
    && Number.isFinite(value.y) && value.y >= -1 && value.y <= 1;
}

export function isAlreadySixteenNine(width: number, height: number) {
  return Math.abs(width / height - 16 / 9) < 0.002;
}

export function needsCoverConfirmation(previousUrl: string, nextUrl: string, cover: CropSettings | null | undefined) {
  return !!nextUrl && nextUrl !== previousUrl && !cover;
}
