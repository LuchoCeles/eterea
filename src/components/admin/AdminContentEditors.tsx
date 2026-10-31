"use client";

import { TextsEditor } from "@/components/admin/AdminTextsEditor";
import { InstagramConnection } from "@/components/admin/InstagramConnection";
import { WhatsAppSettings } from "@/components/admin/WhatsAppSettings";
import { AdminProductsEditor } from "@/components/admin/AdminProductsEditor";
import { AdminCategoriesEditor } from "@/components/admin/AdminCategoriesEditor";
import { SharedImageField } from "@/components/admin/SharedImageField";
import { useContent } from "@/components/providers/ContentProvider";
import { resolveImageSource } from "@/lib/image-source";
import {
  AddButton,
  CollapsibleCard,
  Field,
  ListControls,
  useList,
} from "@/components/admin/AdminEditorFields";
import type {
  ContentKey,
  Slide,
  StoreCategory,
  StoreProduct,
  Texts,
} from "@/lib/content";

export function AdminContentEditor({
  k,
  draft,
  onChange,
  onUploaded,
  onSaveProduct,
}: {
  k: ContentKey;
  draft: unknown;
  onChange: (value: unknown) => void;
  onUploaded: (urls: string[]) => void;
  onSaveProduct?: (products: StoreProduct[], uploadedUrls: string[]) => Promise<boolean>;
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
      <AdminProductsEditor
        value={draft as StoreProduct[]}
        onChange={onChange}
        onSave={onSaveProduct!}
      />
    );
  if (k === "categories")
    return <AdminCategoriesEditor value={draft as StoreCategory[]} onChange={onChange} />;
  if (k === "texts") return <TextsEditor value={draft as Texts} />;
  return <SocialSettings />;
}

function SocialSettings() {
  return (
    <div className="space-y-3 sm:space-y-5">
      <WhatsAppSettings />
      <InstagramConnection />
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
  const products = useContent("products");
  return (
    <div className="space-y-3 sm:space-y-4">
      {value.map((slide, index) => (
        <CollapsibleCard
          key={index}
          title={`Banner ${index + 1}`}
          summary={slide.title || slide.promo || "Sin título"}
          preview={resolveImageSource(slide, products)}
          badge="Imagen + texto"
          right={
            <ListControls i={index} len={value.length} move={list.move} remove={list.remove} />
          }
        >
          <div className="grid gap-4 md:grid-cols-[auto_1fr]">
            <SharedImageField
              label="Foto"
              image={slide.img}
              productId={slide.productId}
              section="banners"
              onUploaded={onUploaded}
              onChange={({ image, productId }) => list.set(index, { img: image, productId })}
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
