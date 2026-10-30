"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Loader2, RotateCcw, ZoomIn } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { PRODUCT_COVER_RATIO, editableImageFormats, type CropSettings, type ImageSettings } from "@/lib/image-presentation";

const PREVIEW_WIDTH = 600;
type Point = { x: number; y: number };

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function drawCrop(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  zoom: number,
  x: number,
  y: number,
) {
  const context = canvas.getContext("2d");
  if (!context) return;
  const scale =
    Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight) * zoom;
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  const maxX = Math.max(0, (width - canvas.width) / 2);
  const maxY = Math.max(0, (height - canvas.height) / 2);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(
    image,
    (canvas.width - width) / 2 + x * maxX,
    (canvas.height - height) / 2 + y * maxY,
    width,
    height,
  );
}

export function ProductImageEditor({
  source,
  initialSettings,
  cover = false,
  onClose,
  onApply,
}: {
  source: string;
  initialSettings?: ImageSettings | CropSettings | null;
  cover?: boolean;
  onClose: () => void;
  onApply: (settings: ImageSettings | CropSettings) => void;
}) {
  const editableSettings = cover || !initialSettings || !("format" in initialSettings)
    || initialSettings.format === "1:1";
  const initialZoom = editableSettings ? initialSettings?.zoom ?? 1 : 1;
  const initialOffset = {
    x: editableSettings ? initialSettings?.x ?? 0 : 0,
    y: editableSettings ? initialSettings?.y ?? 0 : 0,
  };
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointersRef = useRef(new Map<number, Point>());
  const dragRef = useRef<{ pointerId: number; start: Point; offset: Point } | null>(null);
  const pinchRef = useRef<{ distance: number; zoom: number; focal: Point } | null>(null);
  const zoomRef = useRef(initialZoom);
  const offsetRef = useRef<Point>(initialOffset);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(initialZoom);
  const [offset, setOffset] = useState(initialOffset);
  const [error, setError] = useState("");
  const ratio = cover ? PRODUCT_COVER_RATIO : 1;
  const previewHeight = Math.round(PREVIEW_WIDTH / ratio);

  useEffect(() => {
    let cancelled = false;
    let temporaryUrl = "";
    async function load() {
      try {
        const url = source.startsWith("https://res.cloudinary.com/")
          ? await fetch(`/api/media?url=${encodeURIComponent(source)}`).then(async (response) => {
              if (!response.ok) throw new Error("No se pudo abrir esta imagen para editarla.");
              temporaryUrl = URL.createObjectURL(await response.blob());
              return temporaryUrl;
            })
          : source;
        if (cancelled) {
          if (temporaryUrl) URL.revokeObjectURL(temporaryUrl);
          temporaryUrl = "";
          return;
        }
        const next = new Image();
        next.onload = () => {
          if (!cancelled) setImage(next);
        };
        next.onerror = () => {
          if (!cancelled) setError("No se pudo abrir esta imagen para editarla.");
        };
        next.src = url;
      } catch {
        if (!cancelled) setError("No se pudo abrir esta imagen para editarla.");
      }
    }
    void load();
    return () => {
      cancelled = true;
      if (temporaryUrl) URL.revokeObjectURL(temporaryUrl);
    };
  }, [source]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && image) drawCrop(canvas, image, zoom, offset.x, offset.y);
  }, [image, zoom, offset, previewHeight]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    function handleWheel(event: WheelEvent) {
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? canvas!.clientHeight : 1;
      const delta = Math.max(-120, Math.min(120, event.deltaY * unit));
      const next = clamp(zoomRef.current * Math.exp(-delta * 0.002), 1, 3);
      zoomRef.current = next;
      setZoom(next);
    }

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [image]);

  function startPinch(canvas: HTMLCanvasElement) {
    if (!image) return;
    const [first, second] = [...pointersRef.current.values()];
    if (!first || !second) return;
    const rect = canvas.getBoundingClientRect();
    const middle = {
      x: (((first.x + second.x) / 2 - rect.left) * canvas.width) / rect.width,
      y: (((first.y + second.y) / 2 - rect.top) * canvas.height) / rect.height,
    };
    const scale =
      Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight) *
      zoomRef.current;
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    const maxX = Math.max(0, (width - canvas.width) / 2);
    const maxY = Math.max(0, (height - canvas.height) / 2);
    pinchRef.current = {
      distance: Math.max(1, Math.hypot(first.x - second.x, first.y - second.y)),
      zoom: zoomRef.current,
      focal: {
        x: (middle.x - (canvas.width - width) / 2 - offsetRef.current.x * maxX) / scale,
        y: (middle.y - (canvas.height - height) / 2 - offsetRef.current.y * maxY) / scale,
      },
    };
  }

  function move(event: PointerEvent<HTMLCanvasElement>) {
    if (!image || !pointersRef.current.has(event.pointerId)) return;
    const canvas = event.currentTarget;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const rect = canvas.getBoundingClientRect();
    if (pointersRef.current.size >= 2) {
      if (!pinchRef.current) startPinch(canvas);
      const pinch = pinchRef.current;
      const [first, second] = [...pointersRef.current.values()];
      if (!pinch || !first || !second) return;
      const nextZoom = clamp(
        (pinch.zoom * Math.hypot(first.x - second.x, first.y - second.y)) / pinch.distance,
        1,
        3,
      );
      const scale =
        Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight) * nextZoom;
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      const maxX = Math.max(0, (width - canvas.width) / 2);
      const maxY = Math.max(0, (height - canvas.height) / 2);
      const middleX = (((first.x + second.x) / 2 - rect.left) * canvas.width) / rect.width;
      const middleY = (((first.y + second.y) / 2 - rect.top) * canvas.height) / rect.height;
      const nextOffset = {
        x: maxX
          ? clamp((middleX - pinch.focal.x * scale - (canvas.width - width) / 2) / maxX, -1, 1)
          : 0,
        y: maxY
          ? clamp((middleY - pinch.focal.y * scale - (canvas.height - height) / 2) / maxY, -1, 1)
          : 0,
      };
      zoomRef.current = nextZoom;
      offsetRef.current = nextOffset;
      setZoom(nextZoom);
      setOffset(nextOffset);
      return;
    }

    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const scale =
      Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight) *
      zoomRef.current;
    const maxX = Math.max(0, (image.naturalWidth * scale - canvas.width) / 2);
    const maxY = Math.max(0, (image.naturalHeight * scale - canvas.height) / 2);
    const nextOffset = {
      x: maxX
        ? clamp(
            drag.offset.x + ((event.clientX - drag.start.x) * canvas.width) / rect.width / maxX,
            -1,
            1,
          )
        : 0,
      y: maxY
        ? clamp(
            drag.offset.y + ((event.clientY - drag.start.y) * canvas.height) / rect.height / maxY,
            -1,
            1,
          )
        : 0,
    };
    offsetRef.current = nextOffset;
    setOffset(nextOffset);
  }

  function endPointer(event: PointerEvent<HTMLCanvasElement>) {
    pointersRef.current.delete(event.pointerId);
    pinchRef.current = null;
    const [remaining] = pointersRef.current.entries();
    dragRef.current = remaining
      ? { pointerId: remaining[0], start: remaining[1], offset: offsetRef.current }
      : null;
    if (pointersRef.current.size >= 2) startPinch(event.currentTarget);
  }

  function apply() {
    if (!image) return;
    if (cover && (image.naturalWidth < 4 || image.naturalHeight < 5)) {
      setError("La foto es demasiado pequeña para usarla como portada.");
      return;
    }
    const settings = { zoom: zoomRef.current, x: offsetRef.current.x, y: offsetRef.current.y,
      width: image.naturalWidth, height: image.naturalHeight };
    onApply(cover ? settings : { ...settings, format: editableImageFormats[0] });
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="flex h-[100dvh] w-screen max-w-none flex-col gap-0 overflow-hidden border-0 p-0 sm:h-[min(96dvh,900px)] sm:w-[min(92vw,620px)] sm:rounded-2xl sm:border">
        <DialogHeader className="shrink-0 border-b px-5 py-5 text-left sm:px-7">
          <DialogTitle className="text-xl">{cover ? "Ajustar portada para tarjetas" : "Ajustar foto"}</DialogTitle>
          <DialogDescription>
            {cover
              ? "Elegí qué parte de la foto se verá en las tarjetas. Arrastrá para moverla o usá dos dedos para acercar."
              : "Elegí qué parte de la foto se verá en la ficha del producto. Arrastrá para moverla o usá dos dedos para acercar."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] gap-3 overflow-hidden bg-secondary/30 p-3 sm:gap-4 sm:p-5">
          <div className="relative flex min-h-0 min-w-0 items-center justify-center">
            <canvas
              ref={canvasRef}
              width={PREVIEW_WIDTH}
              height={previewHeight}
              onPointerDown={(event) => {
                if (!image) return;
                event.currentTarget.setPointerCapture(event.pointerId);
                const point = { x: event.clientX, y: event.clientY };
                pointersRef.current.set(event.pointerId, point);
                if (pointersRef.current.size === 1) {
                  dragRef.current = {
                    pointerId: event.pointerId,
                    start: point,
                    offset: offsetRef.current,
                  };
                } else {
                  dragRef.current = null;
                  startPinch(event.currentTarget);
                }
              }}
              onPointerMove={move}
              onPointerUp={endPointer}
              onPointerCancel={endPointer}
              className="block max-h-full max-w-full touch-none cursor-grab rounded-xl border bg-background shadow-xl active:cursor-grabbing"
              aria-label="Vista previa del recorte; arrastrá para mover, pellizcá con dos dedos o usá la rueda del mouse para ampliar"
            />
            {!image && (
              <div className="absolute inset-0 grid place-items-center text-center text-sm text-muted-foreground">
                {error || <Loader2 className="h-6 w-6 animate-spin" />}
              </div>
            )}
          </div>
          <div className="mx-auto flex w-full max-w-[520px] min-w-0 flex-col gap-3">
            <p className="text-center text-xs text-muted-foreground">
              <span className="sm:hidden">Arrastrá para mover la foto y usá dos dedos para ampliar o reducir.</span>
              <span className="hidden sm:inline">Usá la rueda del mouse para ampliar o reducir y arrastrá para mover la foto.</span>
            </p>
            <div className="flex w-full items-center gap-2 rounded-xl border bg-background px-3 py-2 sm:py-3">
              <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" />
              <label htmlFor="product-image-zoom" className="sr-only">
                Zoom de la foto
              </label>
              <input
                id="product-image-zoom"
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={zoom}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  zoomRef.current = next;
                  setZoom(next);
                }}
                className="min-w-0 flex-1 accent-primary"
              />
              <span className="w-10 text-right text-xs tabular-nums">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                onClick={() => {
                  zoomRef.current = 1;
                  offsetRef.current = { x: 0, y: 0 };
                  setZoom(1);
                  setOffset({ x: 0, y: 0 });
                }}
                aria-label="Restablecer encuadre"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg hover:bg-secondary"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
            {error && image && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>
        <div className="flex shrink-0 gap-3 border-t bg-background px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:justify-end sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 flex-1 rounded-xl border px-5 text-sm font-medium hover:bg-secondary sm:flex-none"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={apply}
            disabled={!image}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50 sm:flex-none"
          >
            Confirmar encuadre
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
