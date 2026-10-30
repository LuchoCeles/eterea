"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Package, Save, X } from "lucide-react";
import { toast } from "sonner";
import { ProductCategorySelect } from "@/components/admin/ProductCategorySelect";
import { ProductColorsEditor } from "@/components/admin/ProductColorsEditor";
import { ProductInputField } from "@/components/admin/ProductInputField";
import { ProductOptionsEditor } from "@/components/admin/ProductOptionsEditor";
import { ProductPaymentPricesEditor } from "@/components/admin/ProductPaymentPricesEditor";
import { ProductPricePreview } from "@/components/admin/ProductPricePreview";
import { ProductStagedGallery, type GalleryItem } from "@/components/admin/ProductStagedGallery";
import { useProductEditorBaseline } from "@/components/admin/useProductEditorBaseline";
import { useContent } from "@/components/providers/ContentProvider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import type { StoreProduct } from "@/lib/content";
import { uploadImages } from "@/lib/media-client";
import { productEditorSnapshot } from "@/lib/product-editor-snapshot";
import { needsCoverConfirmation } from "@/lib/image-presentation";

type Category = { id: string; name: string; hidden?: boolean };

export function ProductEditorModal({
  initial,
  isNew,
  categories,
  onClose,
  onSave,
}: {
  initial: StoreProduct;
  isNew: boolean;
  categories: Category[];
  onClose: () => void;
  onSave: (product: StoreProduct, uploadedUrls: string[]) => Promise<boolean>;
}) {
  const [product, setProduct] = useState(initial);
  const offersEnabled = useContent("texts").offers.enabled;
  const [basePayment] = useState(() => isNew || (
    initial.paymentPrices?.[0]?.label === "Transferencia" &&
    initial.paymentPrices[0].price === initial.price
  ));
  const [paymentEditorVersion, setPaymentEditorVersion] = useState(0);
  const [items, setItems] = useState<GalleryItem[]>(() =>
    (initial.images?.length ? initial.images : initial.image ? [initial.image] : []).map((url, index) => ({
      id: crypto.randomUUID(),
      url,
      settings: initial.imageSettings?.[index] ?? null,
      coverSettings: index === 0 ? initial.coverSettings ?? null : null,
    })),
  );
  const [initialSnapshot] = useState(() => productEditorSnapshot(initial, items));
  const baseline = useProductEditorBaseline(initial.id, initialSnapshot);
  const hasChanges = productEditorSnapshot(product, items) !== baseline;
  const [saving, setSaving] = useState(false);
  const [phase, setPhase] = useState("");
  const objectUrls = useRef(new Set<string>());
  const uploadedUrls = useRef<string[]>([]);
  const saved = useRef(false);

  useEffect(
    () => () => {
      objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
      if (!saved.current && uploadedUrls.current.length) {
        void fetch("/api/media", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls: uploadedUrls.current }),
        });
      }
    },
    [],
  );

  function patch(next: Partial<StoreProduct>) {
    setProduct((current) => ({ ...current, ...next }));
  }

  function swapPrices() {
    setProduct((current) => {
      const price = current.oldPrice ?? current.price;
      return {
        ...current,
        price,
        oldPrice: current.price,
        paymentPrices: basePayment && current.paymentPrices
          ? current.paymentPrices.map((payment, index) => index === 0 ? { ...payment, price } : payment)
          : current.paymentPrices,
      };
    });
    setPaymentEditorVersion((current) => current + 1);
  }

  async function save() {
    if (saving || !hasChanges) return;
    const name = product.name.trim();
    if (!name) {
      toast.error("Escribí el nombre del producto.");
      return;
    }
    if (!categories.some((category) => category.id === product.categoryId)) {
      toast.error("Elegí una categoría válida.");
      return;
    }
    if (!Number.isFinite(product.price) || product.price < 0) {
      toast.error("Ingresá un precio válido.");
      return;
    }
    if (needsCoverConfirmation(initial.image, items[0]?.url ?? "", items[0]?.coverSettings)) {
      toast.error("Confirmá el encuadre de la nueva portada antes de guardar.");
      return;
    }
    setSaving(true);
    try {
      const pending = items.filter((item) => item.file);
      let nextItems = items;
      if (pending.length) {
        setPhase(`Subiendo ${pending.length} ${pending.length === 1 ? "foto" : "fotos"}…`);
        const urls = await uploadImages(
          pending.map((item) => item.file!),
          "productos",
        );
        uploadedUrls.current = [...new Set([...uploadedUrls.current, ...urls])];
        const mapped = new Map(pending.map((item, index) => [item.id, urls[index]]));
        nextItems = items.map((item) =>
          mapped.has(item.id) ? { ...item, url: mapped.get(item.id)!, file: undefined } : item,
        );
        setItems(nextItems);
      }
      setPhase("Guardando producto…");
      const images = nextItems.map((item) => item.url);
      const imageSettings = nextItems.map((item) => item.settings ?? null);
      const coverSettings = nextItems[0]?.coverSettings ?? null;
      const paymentPrices = basePayment && product.paymentPrices
        ? product.paymentPrices.map((payment, index) => index === 0 ? { ...payment, price: product.price } : payment)
        : product.paymentPrices;
      const result = await onSave(
        { ...product, name, tag: undefined, paymentPrices, images, imageSettings, coverSettings, image: images[0] ?? "" },
        uploadedUrls.current,
      );
      if (result) {
        saved.current = true;
        onClose();
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el producto. Intentá de nuevo.",
      );
    } finally {
      setSaving(false);
      setPhase("");
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !saving) onClose();
      }}
    >
      <DialogContent
        onEscapeKeyDown={(event) => {
          if (saving) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (saving) event.preventDefault();
        }}
        className="flex h-[100dvh] w-screen max-w-none flex-col gap-0 overflow-hidden border-0 bg-secondary/20 p-0 sm:h-[min(94dvh,1050px)] sm:w-[min(96vw,1180px)] sm:rounded-2xl sm:border"
      >
        <DialogHeader className="shrink-0 border-b bg-background px-5 py-4 text-left sm:px-7 sm:py-5">
          <div className="flex items-center gap-3 pr-8">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Package className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="text-xl sm:text-2xl">
                {isNew ? "Nuevo producto" : "Editar producto"}
              </DialogTitle>
              <DialogDescription className="mt-1">
                Completá los datos y guardá todo desde acá.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-7 sm:py-7">
          <fieldset
            disabled={saving}
            className="mx-auto grid min-w-0 max-w-[1100px] items-start gap-5 border-0 p-0 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-6"
          >
            <div className="space-y-5">
              <section
                tabIndex={0}
                className="no-scrollbar space-y-5 rounded-2xl border bg-card p-4 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5 lg:h-[min(70dvh,640px)] lg:overflow-y-auto"
              >
                <div>
                  <h3 className="text-base font-semibold">Información del producto</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Estos datos se mostrarán en la tienda.
                  </p>
                </div>
                <ProductInputField
                  label="Nombre del producto"
                  value={product.name}
                  onChange={(name) => patch({ name })}
                  placeholder="Ej. Vestido Lino Aura"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <ProductCategorySelect
                    categories={categories}
                    value={product.categoryId ?? ""}
                    onChange={(category) =>
                      patch({ categoryId: category.id, category: category.name })
                    }
                  />
                  <label className="flex min-w-0 flex-col gap-2 text-xs font-semibold text-muted-foreground">
                    Sección del inicio (opcional)
                    <select
                      value={product.section ?? ""}
                      onChange={(event) =>
                        patch({ section: event.target.value ? event.target.value as "nuevo" | "sale" : null })
                      }
                      className="min-h-11 w-full rounded-xl border bg-background px-3 text-sm font-normal text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Sin sección</option>
                      <option value="nuevo">Lo nuevo</option>
                      <option value="sale">Ofertas</option>
                    </select>
                    <span className="text-xs font-normal leading-relaxed">
                      “Nuevo” aparece en Lo nuevo. “Oferta” aparece automáticamente si el precio antes de la oferta supera al precio actual y las ofertas están activas.
                    </span>
                  </label>
                </div>
                <label className="flex items-center justify-between gap-3 rounded-xl border bg-secondary/30 px-4 py-3">
                  <span>
                    <span className="block text-sm font-semibold">Producto activo</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      Visible en el catálogo de la tienda
                    </span>
                  </span>
                  <Switch
                    checked={!product.hidden}
                    onCheckedChange={(checked) => patch({ hidden: !checked })}
                    aria-label="Producto activo"
                  />
                </label>
                <label className="flex items-center justify-between gap-3 rounded-xl border bg-secondary/30 px-4 py-3">
                  <span>
                    <span className="block text-sm font-semibold">Producto agotado</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      Seguirá visible, pero no se podrá agregar al carrito.
                    </span>
                  </span>
                  <Switch
                    checked={product.soldOut === true}
                    onCheckedChange={(checked) => patch({ soldOut: checked })}
                    aria-label="Producto agotado"
                  />
                </label>
                <div>
                  <label
                    htmlFor={`description-${product.id}`}
                    className="block text-xs font-semibold text-muted-foreground"
                  >
                    Descripción
                  </label>
                  <textarea
                    id={`description-${product.id}`}
                    rows={4}
                    maxLength={4000}
                    value={product.description ?? ""}
                    onChange={(event) => patch({ description: event.target.value })}
                    placeholder="Contá cómo es la prenda, su calce y sus detalles…"
                    className="mt-2 min-h-28 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </section>
              <ProductStagedGallery
                items={items}
                onChange={setItems}
                onObjectUrl={(url) => objectUrls.current.add(url)}
                disabled={saving}
              />
            </div>
            <div className="space-y-5">
              <section
                tabIndex={0}
                className="no-scrollbar space-y-4 rounded-2xl border bg-card p-4 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5 lg:h-[min(70dvh,640px)] lg:overflow-y-auto"
              >
                <div>
                  <h3 className="text-base font-semibold">Precios</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    El precio actual se agrega al carrito. Si cargás un precio más alto en “Precio antes de la oferta”, aparecerá tachado y se mostrará el descuento.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ProductInputField
                    label="Precio actual ($)"
                    type="number"
                    value={product.price}
                    onChange={(next) => patch({ price: Number(next) || 0 })}
                  />
                  <ProductInputField
                    label="Precio antes de la oferta ($, opcional)"
                    type="number"
                    value={product.oldPrice ?? ""}
                    onChange={(next) => patch({ oldPrice: next ? Number(next) : undefined })}
                  />
                </div>
                <ProductPaymentPricesEditor
                  key={paymentEditorVersion}
                  basePrice={product.price}
                  basePayment={basePayment}
                  prices={product.paymentPrices ?? []}
                  onChange={(paymentPrices) =>
                    patch({ paymentPrices: paymentPrices.length ? paymentPrices : undefined })
                  }
                />
                <ProductPricePreview product={product} offersEnabled={offersEnabled} onSwapPrices={swapPrices} />
              </section>
              <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
                <h3 className="text-base font-semibold">Variantes</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Agregá talles y colores. Marcá los colores agotados por separado.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <ProductOptionsEditor
                    label="Talles"
                    singular="Talle"
                    items={product.sizes ?? []}
                    onChange={(sizes) => patch({ sizes })}
                  />
                  <ProductColorsEditor
                    colors={product.colors ?? []}
                    soldOutColors={product.soldOutColors ?? []}
                    onChange={(colors, soldOutColors) => patch({ colors, soldOutColors })}
                  />
                </div>
              </section>
            </div>
          </fieldset>
        </div>
        <div className="shrink-0 border-t bg-background px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-7 sm:py-4">
          <div className="mx-auto flex max-w-[1100px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {saving && phase.startsWith("Subiendo") ? (
                phase
              ) : !saving ? (
                <>
                  <Check className="mr-1 inline h-3.5 w-3.5" />
                  Las fotos se subirán cuando guardes.
                </>
              ) : null}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border px-5 text-sm font-medium hover:bg-secondary disabled:opacity-50 sm:flex-none"
              >
                <X className="h-4 w-4" />
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving || !hasChanges}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-60 sm:flex-none"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? phase : "Guardar producto"}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
