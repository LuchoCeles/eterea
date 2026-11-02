"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { TextsEditor } from "@/components/admin/AdminTextsEditor";
import { InstagramConnection } from "@/components/admin/InstagramConnection";
import { WhatsAppSettings } from "@/components/admin/WhatsAppSettings";
import { AdminProductsEditor } from "@/components/admin/AdminProductsEditor";
import { AdminCategoriesEditor } from "@/components/admin/AdminCategoriesEditor";
import { HeroImageField } from "@/components/admin/HeroImageField";
import { useContent } from "@/components/providers/ContentProvider";
import { resolveImageSource } from "@/lib/image-source";
import { isStagedHeroImage, removeStagedHeroImage, stagedHeroPreview } from "@/lib/hero-image-staging";
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
  onStructureChange,
  onUploaded,
  onSaveProduct,
  savedHeroValue,
  heroStructureDirty,
  heroSaving,
  onSaveHeroBanner,
}: {
  k: ContentKey;
  draft: unknown;
  onChange: (value: unknown) => void;
  onStructureChange?: (value: unknown) => void;
  onUploaded: (urls: string[]) => void;
  onSaveProduct?: (products: StoreProduct[], uploadedUrls: string[]) => Promise<boolean>;
  savedHeroValue?: Slide[];
  heroStructureDirty?: boolean;
  heroSaving?: boolean;
  onSaveHeroBanner?: (index: number) => Promise<boolean>;
}) {
  if (k === "promo") return <PromoEditor value={draft as string[]} onChange={onChange} />;
  if (k === "hero")
    return (
      <HeroEditor
        value={draft as Slide[]}
        onChange={onChange}
        onStructureChange={onStructureChange!}
        savedValue={savedHeroValue!}
        structureDirty={heroStructureDirty === true}
        saving={heroSaving === true}
        onSaveBanner={onSaveHeroBanner!}
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
  onStructureChange,
  savedValue,
  structureDirty,
  saving,
  onSaveBanner,
}: {
  value: Slide[];
  onChange: (value: Slide[]) => void;
  onStructureChange: (value: Slide[]) => void;
  savedValue: Slide[];
  structureDirty: boolean;
  saving: boolean;
  onSaveBanner: (index: number) => Promise<boolean>;
}) {
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const list = useList(value, onStructureChange);
  const products = useContent("products");
  const setSlide = (index: number, patch: Partial<Slide>) => onChange(value.map((slide, current) =>
    current === index ? { ...slide, ...patch } : slide));
  return (
    <div className="space-y-3 sm:space-y-4">
      {value.map((slide, index) => {
        const changed = savedValue[index] && JSON.stringify(slide) !== JSON.stringify(savedValue[index]);
        return (
        <CollapsibleCard
          key={slide.id ?? index}
          title={`Banner ${index + 1}`}
          summary={slide.title || slide.promo || "Sin título"}
          preview={isStagedHeroImage(slide.img) ? stagedHeroPreview(slide.img) : resolveImageSource(slide, products)}
          badge="Imagen + texto"
          right={<>
            {changed && !structureDirty && <button type="button" disabled={savingIndex !== null}
              onClick={async () => {
                setSavingIndex(index);
                try { await onSaveBanner(index); } finally { setSavingIndex(null); }
              }}
              className="admin-save-button inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-50">
              {savingIndex === index ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar banner
            </button>}
            <ListControls i={index} len={value.length} disabled={saving} move={list.move} remove={(position) => {
              if (isStagedHeroImage(value[position].img)) void removeStagedHeroImage(value[position].img).catch(() => undefined);
              list.remove(position);
            }} />
          </>}
        >
          <div className="grid gap-6">
            <HeroImageField
              slide={slide}
              onSourceChange={({ image, productId }) => setSlide(index, {
                img: image, productId, desktopSettings: null, mobileSettings: null,
              })}
              onSettingsChange={(screen, settings) => setSlide(index,
                screen === "desktop" ? { desktopSettings: settings } : { mobileSettings: settings })}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Texto chico"
                value={slide.kicker}
                onChange={(next) => setSlide(index, { kicker: next })}
              />
              <Field
                label="Título"
                value={slide.title}
                onChange={(next) => setSlide(index, { title: next })}
              />
              <Field
                label="Botón"
                value={slide.cta}
                onChange={(next) => setSlide(index, { cta: next })}
              />
              <Field
                label="Promoción"
                value={slide.promo}
                onChange={(next) => setSlide(index, { promo: next })}
              />
              <label className="text-xs text-muted-foreground">
                Ubicación del texto
                <select
                  value={slide.align}
                  onChange={(event) =>
                    setSlide(index, { align: event.target.value as Slide["align"] })
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
      );})}
      <AddButton
        disabled={saving}
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
