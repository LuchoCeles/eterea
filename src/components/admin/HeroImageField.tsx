"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ProductImageEditor } from "@/components/admin/ProductImageEditor";
import { ProductImagePicker } from "@/components/admin/ProductImagePicker";
import { ProductImage } from "@/components/store/ProductImage";
import { useContent } from "@/components/providers/ContentProvider";
import { resolveImageSource } from "@/lib/image-source";
import { HERO_DESKTOP_RATIO, HERO_MOBILE_RATIO, heroImageStyle, heroPreviewRatio, legacyMobileImageX } from "@/lib/hero-image";
import { isStagedHeroImage, removeStagedHeroImage, stageHeroImage, stagedHeroPreview, stagedHeroSource } from "@/lib/hero-image-staging";
import type { Slide } from "@/lib/content";
import type { CropSettings } from "@/lib/image-presentation";

type Screen = "desktop" | "mobile";

function BannerPreview({ slide, source, screen, ratio }: { slide: Slide; source: string; screen: Screen; ratio: number }) {
  const mobile = screen === "mobile";
  return (
    <div
      className="relative w-full overflow-hidden rounded-lg bg-muted"
      style={{ aspectRatio: ratio }}
    >
      {source && <ProductImage
        src={source}
        alt=""
        className="absolute max-w-none object-cover"
        style={heroImageStyle(mobile ? slide.mobileSettings : slide.desktopSettings,
          mobile ? legacyMobileImageX(slide.align) : 0)}
      />}
      <div aria-hidden="true" className={`absolute inset-0 ${mobile
        ? "bg-gradient-to-t from-black/80 via-black/25 to-transparent"
        : `${slide.align === "right" ? "bg-gradient-to-l" : "bg-gradient-to-r"} from-black/70 via-black/30 to-transparent`}`} />
      <div className={`absolute bottom-[12%] max-w-[65%] text-white ${slide.align === "right" ? "right-[7%] text-right" : "left-[7%]"}`}>
        <p className="line-clamp-1 text-[9px] uppercase tracking-widest sm:text-xs">{slide.kicker}</p>
        <p className={`line-clamp-2 font-display leading-none ${mobile ? "text-xl" : "text-xl sm:text-3xl"}`}>{slide.title}</p>
        <p className="mt-2 line-clamp-1 text-[9px] sm:text-xs">{slide.cta}</p>
      </div>
    </div>
  );
}

export function HeroImageField({ slide, onSourceChange, onSettingsChange }: {
  slide: Slide;
  onSourceChange: (next: { image: string; productId?: string }) => void;
  onSettingsChange: (screen: Screen, settings: CropSettings) => void;
}) {
  const [editing, setEditing] = useState<Screen | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [localSource, setLocalSource] = useState("");
  const [ratios, setRatios] = useState({ desktop: HERO_DESKTOP_RATIO, mobile: HERO_MOBILE_RATIO });
  const products = useContent("products");
  const selected = products.find((product) => product.id === slide.productId);
  const staged = isStagedHeroImage(slide.img);
  const source = staged ? localSource || stagedHeroPreview(slide.img)
    : (slide.img || slide.productId ? resolveImageSource(slide, products) : "");
  const editorSource = staged ? localSource : source;
  const settings = editing === "mobile" ? slide.mobileSettings : slide.desktopSettings;
  const initialSettings = settings ?? (editing === "mobile"
    ? { zoom: 1, x: legacyMobileImageX(slide.align), y: 0, width: 1, height: 1 }
    : null);

  useEffect(() => {
    const updateRatios = () => setRatios({
      desktop: heroPreviewRatio("desktop", window.innerWidth, window.innerHeight),
      mobile: heroPreviewRatio("mobile", window.innerWidth, window.innerHeight),
    });
    updateRatios();
    window.addEventListener("resize", updateRatios);
    return () => window.removeEventListener("resize", updateRatios);
  }, []);

  useEffect(() => {
    if (!staged) return;
    let active = true;
    stagedHeroSource(slide.img).then((url) => { if (active) setLocalSource(url); })
      .catch((error: unknown) => toast.error(error instanceof Error ? error.message : "No se pudo recuperar la imagen local."));
    return () => { active = false; };
  }, [slide.img, staged]);

  function changeSource(next: { image: string; productId?: string }) {
    setEditing("desktop");
    setLocalSource(isStagedHeroImage(next.image) ? stagedHeroPreview(next.image) : "");
    if (staged && next.image !== slide.img) void removeStagedHeroImage(slide.img).catch(() => undefined);
    onSourceChange(next);
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3 text-xs text-muted-foreground">
        <p>Imagen del banner · fuente</p>
        {slide.productId ? <div className="flex items-center gap-3">
          <ProductImage src={source} alt="" sizes="64px" className="h-20 w-16 rounded-xl border object-cover" />
          <p className="max-w-48 leading-5">{selected
            ? `Se usa la foto de ${selected.name}. Si la cambiás en Productos, se actualiza acá.`
            : "Este producto ya no está disponible."}</p>
        </div> : <div className="flex items-center gap-3">
          {source ? <img src={source} alt="" className="h-20 w-16 rounded-xl border object-cover" />
            : <div className="h-20 w-16 rounded-xl border bg-muted" />}
          <label className="flex min-h-11 cursor-pointer items-center rounded-xl border px-3 py-2 text-sm text-foreground hover:bg-secondary">
            Cambiar foto
            <input type="file" accept="image/avif,image/gif,image/jpeg,image/png,image/webp" className="hidden"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                event.currentTarget.value = "";
                if (!file) return;
                try {
                  const { marker, ready } = stageHeroImage(file);
                  changeSource({ image: marker });
                  void ready.catch(() => toast.error("La foto se puede editar, pero no quedó guardada para volver a abrir esta página."));
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "No se pudo preparar la foto.");
                }
              }} />
          </label>
        </div>}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setPickerOpen(true)} className="min-h-11 rounded-lg border px-3 py-2 text-sm text-foreground hover:bg-secondary">
            {slide.productId ? "Cambiar producto" : "Elegir foto de producto"}
          </button>
          {slide.productId && <button type="button" onClick={() => changeSource({ image: slide.img, productId: undefined })}
            className="min-h-11 rounded-lg border px-3 py-2 text-sm text-foreground hover:bg-secondary">Usar foto propia</button>}
        </div>
      </div>
      <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(150px,200px)]">
        {(["desktop", "mobile"] as const).map((screen) => (
          <div key={screen} className="space-y-2">
            <p className="text-sm font-medium">{screen === "desktop" ? "Escritorio" : "Móvil"}</p>
            <BannerPreview slide={slide} source={source} screen={screen} ratio={ratios[screen]} />
            <button
              type="button"
              disabled={!editorSource}
              onClick={() => setEditing(screen)}
              className="min-h-11 w-full rounded-lg border px-3 py-2 text-sm font-medium hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Ajustar {screen === "desktop" ? "escritorio" : "móvil"}
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Las vistas muestran las proporciones de referencia del banner. El alto visible puede variar según la pantalla.</p>
      {editing && editorSource && <ProductImageEditor
        key={`${editing}-${editorSource}`}
        source={editorSource}
        cropRatio={ratios[editing]}
        initialSettings={initialSettings}
        title={`Ajustar banner para ${editing === "desktop" ? "escritorio" : "móvil"}`}
        description="Arrastrá la foto para ubicarla y usá la rueda del mouse o dos dedos para ampliar. Este encuadre se guarda por separado para cada pantalla."
        onClose={() => setEditing(null)}
        onApply={(next) => {
          onSettingsChange(editing, next as CropSettings);
          setEditing(editing === "desktop" ? "mobile" : null);
        }}
      />}
      {pickerOpen && <ProductImagePicker open={pickerOpen} products={products} selectedId={slide.productId}
        onClose={() => setPickerOpen(false)} onSelect={(id) => changeSource({ image: "", productId: id })} />}
    </div>
  );
}
