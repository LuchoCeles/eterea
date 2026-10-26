"use client";

import { Loader2, Save } from "lucide-react";
import { hasUnsavedChanges, useAdminSave } from "@/components/admin/AdminSaveProvider";
import { HomeSectionVisibility } from "@/components/admin/HomeSectionVisibility";
import { AdminHomeCategoriesEditor } from "@/components/admin/AdminHomeCategoriesEditor";
import { SharedImageField } from "@/components/admin/SharedImageField";
import {
  AddButton,
  CollapsibleCard,
  Field,
  ListControls,
  useList,
} from "@/components/admin/AdminEditorFields";
import type { TextSectionKey, Texts } from "@/lib/content";

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
    homeSections: get("homeSections"), homeCategoryCards: get("homeCategoryCards"),
    benefits: get("benefits"), split: get("split"), club: get("club"),
    marquee: get("marquee"), editorial: get("editorial"),
  };
  const set = <K extends TextSectionKey>(key: K, next: Texts[K]) =>
    changeText(key, savedValue[key], next);
  const benefits = useList(value.benefits, (next) => set("benefits", next));
  const marquee = useList(value.marquee, (next) => set("marquee", next));
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
      <CollapsibleCard
        title="Franja publicitaria"
        summary={`${value.benefits.length} mensajes de marca · debajo de los banners, como la barra superior`}
        right={<SectionSaveButton section="benefits" label="Franja publicitaria" value={savedValue.benefits} />}
      >
        <div className="space-y-2 md:grid md:grid-cols-3 md:items-start">
          {value.benefits.map((benefit, index) => (
            <CollapsibleCard
              key={index}
              title={`Mensaje ${index + 1}`}
              summary={benefit.t || "Sin título"}
            >
              <div className="space-y-3">
                <Field
                  label="Texto principal"
                  value={benefit.t}
                  onChange={(next) => benefits.set(index, { t: next })}
                />
                <Field
                  label="Texto secundario"
                  value={benefit.d}
                  onChange={(next) => benefits.set(index, { d: next })}
                />
              </div>
            </CollapsibleCard>
          ))}
        </div>
      </CollapsibleCard>
      <CollapsibleCard title="Banner de oferta" summary="Banner con foto" right={<SectionSaveButton section="split" label="Banner de oferta" value={savedValue.split} />}>
        <div className="grid gap-4 md:grid-cols-[auto_1fr]">
          <SharedImageField
            label="Foto"
            image={value.split.img}
            productId={value.split.productId}
            section="ofertas"
            onUploaded={(url) => uploadedText("split", savedValue.split, [url])}
            onChange={({ image, productId }) => set("split", { ...value.split, img: image, productId })}
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
      <CollapsibleCard title="Cinta en movimiento" summary={`${value.marquee.length} textos`} right={<SectionSaveButton section="marquee" label="Cinta en movimiento" value={savedValue.marquee} />}>
        <div className="space-y-2">
          {value.marquee.map((message, index) => (
            <CollapsibleCard
              key={index}
              title={`Texto ${index + 1}`}
              summary={message || "Texto vacío"}
              right={
                <ListControls
                  i={index}
                  len={value.marquee.length}
                  move={marquee.move}
                  remove={marquee.remove}
                />
              }
            >
              <Field
                label="Texto"
                value={message}
                onChange={(next) =>
                  set(
                    "marquee",
                    value.marquee.map((item, current) => (current === index ? next : item)),
                  )
                }
              />
            </CollapsibleCard>
          ))}
        </div>
        <AddButton onClick={() => marquee.add("Nuevo texto")}>Agregar texto</AddButton>
      </CollapsibleCard>
      <CollapsibleCard
        title="Sección de la marca"
        summary={value.editorial.title || "Foto y texto institucional"}
        right={<SectionSaveButton section="editorial" label="Sección de la marca" value={savedValue.editorial} />}
      >
        <div className="grid gap-4 md:grid-cols-[auto_1fr]">
          <SharedImageField
            label="Foto"
            image={value.editorial.img}
            productId={value.editorial.productId}
            section="marca"
            onUploaded={(url) => uploadedText("editorial", savedValue.editorial, [url])}
            onChange={({ image, productId }) => set("editorial", { ...value.editorial, img: image, productId })}
          />
          <div className="grid gap-3">
            <Field
              label="Texto chico"
              value={value.editorial.kicker}
              onChange={(next) => set("editorial", { ...value.editorial, kicker: next })}
            />
            <Field
              label="Título"
              value={value.editorial.title}
              onChange={(next) => set("editorial", { ...value.editorial, title: next })}
            />
            <Field
              label="Texto"
              multiline
              value={value.editorial.text}
              onChange={(next) => set("editorial", { ...value.editorial, text: next })}
            />
            <Field
              label="Enlace"
              value={value.editorial.cta}
              onChange={(next) => set("editorial", { ...value.editorial, cta: next })}
            />
          </div>
        </div>
      </CollapsibleCard>
    </div>
  );
}
