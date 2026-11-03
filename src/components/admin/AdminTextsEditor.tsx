"use client";

import { Loader2, Save } from "lucide-react";
import { hasUnsavedChanges, useAdminSave } from "@/components/admin/AdminSaveProvider";
import { HomeSectionVisibility } from "@/components/admin/HomeSectionVisibility";
import { AdminHomeCategoriesEditor } from "@/components/admin/AdminHomeCategoriesEditor";
import { SharedImageField } from "@/components/admin/SharedImageField";
import { CollapsibleCard, Field } from "@/components/admin/AdminEditorFields";
import { Switch } from "@/components/ui/switch";
import type { TextSectionKey, Texts } from "@/lib/content";
import { SPLIT_BANNER_IMAGE_RATIO } from "@/lib/image-presentation";

function SectionSaveButton({ section, label, value }: { section: TextSectionKey; label: string; value: Texts[TextSectionKey] }) {
  const { textDrafts, saveText } = useAdminSave();
  const entry = textDrafts[section];
  const dirty = hasUnsavedChanges(entry);
  if (!dirty && !entry?.saving) return null;
  return (
    <button
      type="button"
      onClick={() => void saveText(section, value)}
      disabled={entry?.saving}
      className="admin-save-button inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
      aria-label={`Guardar ${label.toLocaleLowerCase("es-AR")}`}
    >
      {entry?.saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      Guardar
    </button>
  );
}

export function TextsEditor({ value: savedValue }: { value: Texts }) {
  const { textDrafts, changeText, uploadedText } = useAdminSave();
  const get = <K extends TextSectionKey>(key: K) => (textDrafts[key]?.data ?? savedValue[key]) as Texts[K];
  const value: Texts = {
    ...savedValue,
    offers: get("offers"),
    homeSections: get("homeSections"), homeCategoryCards: get("homeCategoryCards"),
    split: get("split"), club: get("club"),
  };
  const set = <K extends TextSectionKey>(key: K, next: Texts[K]) =>
    changeText(key, savedValue[key], next);
  return (
    <div className="space-y-2 sm:space-y-4">
      <CollapsibleCard
        title="Visibilidad del inicio"
        summary="Elegí qué apartados aparecen en el home"
        right={<SectionSaveButton section="homeSections" label="Visibilidad del inicio" value={savedValue.homeSections} />}
      >
        <p className="mb-4 text-sm text-muted-foreground">
          Ocultá apartados del home sin borrar sus textos, fotos ni configuraciones.
        </p>
        <HomeSectionVisibility
          value={value.homeSections}
          onChange={(homeSections) => set("homeSections", homeSections)}
        />
      </CollapsibleCard>
      <CollapsibleCard
        title="Ofertas"
        summary={value.offers.enabled ? "Ofertas activadas" : "Ofertas desactivadas"}
        right={<SectionSaveButton section="offers" label="Ofertas" value={savedValue.offers} />}
      >
        <p className="mb-4 text-sm text-muted-foreground">
          Al desactivarlas, se ocultan los mensajes promocionales y los descuentos de la tienda.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center justify-between gap-4 rounded-xl border bg-secondary/30 p-4 text-sm">
            <span>Activar ofertas</span>
            <Switch
              checked={value.offers.enabled}
              onCheckedChange={(enabled) => set("offers", { ...value.offers, enabled })}
              aria-label="Activar ofertas"
            />
          </label>
          <label className="flex items-center justify-between gap-4 rounded-xl border bg-secondary/30 p-4 text-sm">
            <span>Mostrar banner de oferta</span>
            <Switch
              checked={value.offers.showSplit}
              onCheckedChange={(showSplit) => set("offers", { ...value.offers, showSplit })}
              aria-label="Mostrar banner de oferta"
            />
          </label>
          <label className="flex items-center justify-between gap-4 rounded-xl border bg-secondary/30 p-4 text-sm">
            <span>Banner del club</span>
            <Switch
              checked={value.offers.showClub}
              onCheckedChange={(showClub) => set("offers", { ...value.offers, showClub })}
              aria-label="Mostrar banner del club"
            />
          </label>
        </div>
      </CollapsibleCard>
      <CollapsibleCard
        title="Categorías destacadas del inicio"
        summary={`${value.homeCategoryCards.filter((card) => !card.hidden).length} destacadas de ${value.homeCategoryCards.length} disponibles`}
        right={<SectionSaveButton section="homeCategoryCards" label="Categorías destacadas del inicio" value={savedValue.homeCategoryCards} />}
      >
        <AdminHomeCategoriesEditor
          value={value.homeCategoryCards}
          onChange={(cards) => set("homeCategoryCards", cards)}
          onUploaded={(url) => uploadedText("homeCategoryCards", savedValue.homeCategoryCards, [url])}
        />
      </CollapsibleCard>
      <CollapsibleCard title="Banner de oferta" summary="Banner con foto" right={<SectionSaveButton section="split" label="Banner de oferta" value={savedValue.split} />}>
        <div className="grid gap-4 md:grid-cols-[auto_1fr]">
          <SharedImageField
            label="Foto"
            image={value.split.img}
            imageSettings={value.split.imageSettings}
            productId={value.split.productId}
            section="ofertas"
            cropRatio={SPLIT_BANNER_IMAGE_RATIO}
            editorTitle="Ajustar imagen del banner de oferta"
            editorDescription="Arrastrá la foto para elegir qué parte se ve en el banner. El encuadre sigue la proporción de la tarjeta de oferta."
            onUploaded={(url) => uploadedText("split", savedValue.split, [url])}
            onChange={(next) => set("split", { ...value.split, img: next.image, productId: next.productId, imageSettings: next.imageSettings })}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Texto chico"
              value={value.split.kicker}
              onChange={(next) => set("split", { ...value.split, kicker: next })}
            />
            <Field
              label="Texto grande"
              value={value.split.big}
              onChange={(next) => set("split", { ...value.split, big: next })}
            />
            <Field
              label="Bajada"
              value={value.split.sub}
              onChange={(next) => set("split", { ...value.split, sub: next })}
            />
            <Field
              label="Botón"
              value={value.split.cta}
              onChange={(next) => set("split", { ...value.split, cta: next })}
            />
          </div>
        </div>
      </CollapsibleCard>
      <CollapsibleCard title="Banner del club" summary="Fondo verde" right={<SectionSaveButton section="club" label="Banner del club" value={savedValue.club} />}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Texto chico"
            value={value.club.kicker}
            onChange={(next) => set("club", { ...value.club, kicker: next })}
          />
          <Field
            label="Texto grande"
            value={value.club.big}
            onChange={(next) => set("club", { ...value.club, big: next })}
          />
          <Field
            label="Descripción"
            value={value.club.text}
            onChange={(next) => set("club", { ...value.club, text: next })}
          />
          <Field
            label="Código"
            value={value.club.code}
            onChange={(next) => set("club", { ...value.club, code: next })}
          />
          <Field
            label="Botón"
            value={value.club.cta}
            onChange={(next) => set("club", { ...value.club, cta: next })}
          />
        </div>
      </CollapsibleCard>
    </div>
  );
}
