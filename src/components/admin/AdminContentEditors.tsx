"use client";

import { InstagramEditor } from "@/components/store/InstagramEditor";
import { TextsEditor } from "@/components/admin/AdminTextsEditor";
import { InstagramConnection } from "@/components/admin/InstagramConnection";
import { WhatsAppSettings } from "@/components/admin/WhatsAppSettings";
import { BatchImageUploader } from "@/components/admin/BatchImageUploader";
import { ProductPaymentPricesEditor } from "@/components/admin/ProductPaymentPricesEditor";
import {
  AddButton,
  CollapsibleCard,
  Field,
  ImageField,
  ListControls,
  useList,
} from "@/components/admin/AdminEditorFields";
import type { ContentKey, InstagramPost, Slide, StoreProduct, Texts } from "@/lib/content";

export function AdminContentEditor({
  k,
  draft,
  onChange,
  onUploaded,
}: {
  k: ContentKey;
  draft: unknown;
  onChange: (value: unknown) => void;
  onUploaded: (urls: string[]) => void;
}) {
  if (k === "promo") return <PromoEditor value={draft as string[]} onChange={onChange} />;
  if (k === "hero")
    return (
      <HeroEditor
        value={draft as Slide[]}
        onChange={onChange}
        onUploaded={(url) => onUploaded([url])}
      />
    );
  if (k === "products")
    return (
      <ProductsEditor value={draft as StoreProduct[]} onChange={onChange} onUploaded={onUploaded} />
    );
  if (k === "texts")
    return (
      <TextsEditor
        value={draft as Texts}
        onChange={onChange}
        onUploaded={(url) => onUploaded([url])}
      />
    );
  return (
    <div className="space-y-3 sm:space-y-5">
      <WhatsAppSettings />
      <InstagramConnection />
      <InstagramEditor
        value={draft as InstagramPost[]}
        onChange={onChange}
        onUploaded={(url) => onUploaded([url])}
      />
    </div>
  );
}

function PromoEditor({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const list = useList(value, onChange);
  return (
    <div>
      <p className="mb-3 text-sm text-muted-foreground sm:mb-4">
        Mensajes que van rotando arriba del menú.
      </p>
      <div className="space-y-2">
        {value.map((message, index) => (
          <CollapsibleCard
            key={index}
            title={`Mensaje ${index + 1}`}
            summary={message || "Mensaje vacío"}
            right={
              <ListControls i={index} len={value.length} move={list.move} remove={list.remove} />
            }
          >
            <Field
              label="Texto"
              value={message}
              onChange={(next) =>
                onChange(value.map((item, current) => (current === index ? next : item)))
              }
            />
          </CollapsibleCard>
        ))}
      </div>
      <AddButton onClick={() => list.add("Nuevo mensaje")}>Agregar mensaje</AddButton>
    </div>
  );
}

function HeroEditor({
  value,
  onChange,
  onUploaded,
}: {
  value: Slide[];
  onChange: (value: Slide[]) => void;
  onUploaded: (url: string) => void;
}) {
  const list = useList(value, onChange);
  return (
    <div className="space-y-3 sm:space-y-4">
      {value.map((slide, index) => (
        <CollapsibleCard
          key={index}
          title={`Banner ${index + 1}`}
          summary={slide.title || slide.promo || "Sin título"}
          preview={slide.img}
          badge="Imagen + texto"
          right={
            <ListControls i={index} len={value.length} move={list.move} remove={list.remove} />
          }
        >
          <div className="grid gap-4 md:grid-cols-[auto_1fr]">
            <ImageField
              label="Foto"
              value={slide.img}
              section="banners"
              onUploaded={onUploaded}
              onChange={(image) => list.set(index, { img: image })}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Texto chico"
                value={slide.kicker}
                onChange={(next) => list.set(index, { kicker: next })}
              />
              <Field
                label="Título"
                value={slide.title}
                onChange={(next) => list.set(index, { title: next })}
              />
              <Field
                label="Botón"
                value={slide.cta}
                onChange={(next) => list.set(index, { cta: next })}
              />
              <Field
                label="Promoción"
                value={slide.promo}
                onChange={(next) => list.set(index, { promo: next })}
              />
              <label className="text-xs text-muted-foreground">
                Ubicación del texto
                <select
                  value={slide.align}
                  onChange={(event) =>
                    list.set(index, { align: event.target.value as Slide["align"] })
                  }
                  className="mt-1 min-h-11 w-full border bg-background px-3 py-2 text-sm"
                >
                  <option value="left">Izquierda</option>
                  <option value="right">Derecha</option>
                </select>
              </label>
            </div>
          </div>
        </CollapsibleCard>
      ))}
      <AddButton
        onClick={() =>
          list.add({
            img: "",
            kicker: "",
            title: "Nuevo banner",
            cta: "Ver más",
            promo: "",
            align: "left",
          })
        }
      >
        Agregar banner
      </AddButton>
    </div>
  );
}

function ProductsEditor({
  value,
  onChange,
  onUploaded,
}: {
  value: StoreProduct[];
  onChange: (value: StoreProduct[]) => void;
  onUploaded: (urls: string[]) => void;
}) {
  const list = useList(value, onChange);
  return (
    <div className="space-y-3">
      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center sm:gap-3">
        <p className="text-sm text-muted-foreground">
          Subí varias fotos juntas para crear productos que después podés completar.
        </p>
        <BatchImageUploader
          section="productos"
          onUploaded={(urls) => {
            onUploaded(urls);
            onChange([
              ...value,
              ...urls.map((image, index) => ({
                id: crypto.randomUUID(),
                name: `Nueva prenda ${value.length + index + 1}`,
                category: "",
                price: 0,
                image,
                section: "nuevo" as const,
              })),
            ]);
          }}
        />
      </div>
      {value.map((product, index) => (
        <CollapsibleCard
          key={product.id}
          title={product.name || "Producto"}
          preview={product.image}
          summary={[
            product.category,
            product.price ? `$${product.price.toLocaleString("es-AR")}` : "Sin precio",
          ]
            .filter(Boolean)
            .join(" · ")}
          right={
            <ListControls i={index} len={value.length} move={list.move} remove={list.remove} />
          }
        >
          <div className="grid gap-4 md:grid-cols-[auto_1fr]">
            <ImageField
              label="Foto"
              value={product.image}
              section="productos"
              onUploaded={(url) => onUploaded([url])}
              onChange={(image) => list.set(index, { image })}
            />
            <div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field
                  label="Nombre"
                  value={product.name}
                  onChange={(next) => list.set(index, { name: next })}
                />
                <Field
                  label="Categoría"
                  value={product.category}
                  onChange={(next) => list.set(index, { category: next })}
                />
                <label className="text-xs text-muted-foreground">
                  Sección
                  <select
                    value={product.section}
                    onChange={(event) =>
                      list.set(index, { section: event.target.value as StoreProduct["section"] })
                    }
                    className="mt-1 min-h-11 w-full border bg-background px-3 py-2 text-sm"
                  >
                    <option value="nuevo">Lo nuevo</option>
                    <option value="sale">Sale</option>
                  </select>
                </label>
                <Field
                  label="Precio ($)"
                  type="number"
                  value={product.price}
                  onChange={(next) => list.set(index, { price: Number(next) || 0 })}
                />
                <Field
                  label="Precio anterior ($, opcional)"
                  type="number"
                  value={product.oldPrice ?? ""}
                  onChange={(next) => {
                    const updated = { ...product };
                    if (next) updated.oldPrice = Number(next);
                    else delete updated.oldPrice;
                    onChange(value.map((item, current) => (current === index ? updated : item)));
                  }}
                />
                <Field
                  label="Etiqueta (ej. Nuevo, -30%)"
                  value={product.tag ?? ""}
                  onChange={(next) => {
                    const updated = { ...product };
                    if (next) updated.tag = next;
                    else delete updated.tag;
                    onChange(value.map((item, current) => (current === index ? updated : item)));
                  }}
                />
              </div>
              <ProductPaymentPricesEditor
                basePrice={product.price}
                prices={product.paymentPrices ?? []}
                onChange={(paymentPrices) =>
                  list.set(index, {
                    paymentPrices: paymentPrices.length ? paymentPrices : undefined,
                  })
                }
              />
            </div>
          </div>
        </CollapsibleCard>
      ))}
      <AddButton
        onClick={() =>
          list.add({
            id: crypto.randomUUID(),
            name: "Nueva prenda",
            category: "",
            price: 0,
            image: "",
            section: "nuevo",
          })
        }
      >
        Agregar producto
      </AddButton>
    </div>
  );
}
