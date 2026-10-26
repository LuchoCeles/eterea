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

const PREVIEW_WIDTH = 600;
const PREVIEW_HEIGHT = 800;
type Point = { x: number; y: number };
export type CropPosition = { zoom: number; x: number; y: number };

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
  initialPosition,
  onClose,
  onApply,
}: {
  source: string;
  initialPosition?: CropPosition;
  onClose: () => void;
  onApply: (file: File, position: CropPosition) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointersRef = useRef(new Map<number, Point>());
  const dragRef = useRef<{ pointerId: number; start: Point; offset: Point } | null>(null);
  const pinchRef = useRef<{ distance: number; zoom: number; focal: Point } | null>(null);
  const zoomRef = useRef(initialPosition?.zoom ?? 1);
  const offsetRef = useRef<Point>({ x: initialPosition?.x ?? 0, y: initialPosition?.y ?? 0 });
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(initialPosition?.zoom ?? 1);
  const [offset, setOffset] = useState({ x: initialPosition?.x ?? 0, y: initialPosition?.y ?? 0 });
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

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
        next.crossOrigin = "anonymous";
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
  }, [image, zoom, offset]);

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
      Math.max(PREVIEW_WIDTH / image.naturalWidth, PREVIEW_HEIGHT / image.naturalHeight) *
      zoomRef.current;
    const maxX = Math.max(0, (image.naturalWidth * scale - PREVIEW_WIDTH) / 2);
    const maxY = Math.max(0, (image.naturalHeight * scale - PREVIEW_HEIGHT) / 2);
    const nextOffset = {
      x: maxX
        ? clamp(
            drag.offset.x + ((event.clientX - drag.start.x) * PREVIEW_WIDTH) / rect.width / maxX,
            -1,
            1,
          )
        : 0,
      y: maxY
        ? clamp(
            drag.offset.y + ((event.clientY - drag.start.y) * PREVIEW_HEIGHT) / rect.height / maxY,
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

  async function apply() {
    if (!image) return;
    setWorking(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 900;
      canvas.height = 1200;
      drawCrop(canvas, image, zoomRef.current, offsetRef.current.x, offsetRef.current.y);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", 0.9),
      );
      if (!blob) throw new Error("No se pudo preparar el recorte.");
      onApply(new File([blob], `producto-${crypto.randomUUID()}.webp`, { type: "image/webp" }), {
        zoom: zoomRef.current,
        x: offsetRef.current.x,
        y: offsetRef.current.y,
      });
    } catch {
      setError("No se pudo preparar el recorte. Intentá de nuevo.");
      setWorking(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !working) onClose();
      }}
    >
      <DialogContent className="flex h-[100dvh] w-screen max-w-none flex-col gap-0 overflow-hidden border-0 p-0 sm:h-auto sm:max-h-[94dvh] sm:w-[min(92vw,780px)] sm:rounded-2xl sm:border">
        <DialogHeader className="border-b px-5 py-5 text-left sm:px-7">
          <DialogTitle className="text-xl">Ajustar foto</DialogTitle>
          <DialogDescription>
            Arrastrá para mover la foto. En el celular, usá dos dedos para acercar o alejar.
          </DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 overflow-y-auto bg-secondary/30 p-4 sm:p-7">
          <div className="relative w-full max-w-[330px] overflow-hidden rounded-xl border bg-background shadow-xl">
            <canvas
              ref={canvasRef}
              width={PREVIEW_WIDTH}
              height={PREVIEW_HEIGHT}
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
              className="block aspect-[3/4] w-full touch-none cursor-grab active:cursor-grabbing"
              aria-label="Vista previa del recorte; arrastrá para mover, pellizcá con dos dedos o usá la rueda del mouse para ampliar"
            />
            {!image && (
              <div className="absolute inset-0 grid place-items-center text-center text-sm text-muted-foreground">
                {error || <Loader2 className="h-6 w-6 animate-spin" />}
              </div>
            )}
          </div>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Usá la rueda del mouse para ampliar o reducir y arrastrá para mover la foto.
          </p>
          <div className="flex w-full max-w-[420px] items-center gap-3 rounded-xl border bg-background px-4 py-3">
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
              className="w-full accent-primary"
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
        <div className="flex gap-3 border-t bg-background px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:justify-end sm:px-7">
          <button
            type="button"
            onClick={onClose}
            disabled={working}
            className="min-h-11 flex-1 rounded-xl border px-5 text-sm font-medium hover:bg-secondary sm:flex-none"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void apply()}
            disabled={!image || working}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50 sm:flex-none"
          >
            {working && <Loader2 className="h-4 w-4 animate-spin" />}Aplicar recorte
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
