"use client";

import { HomeSectionVisibility } from "@/components/admin/HomeSectionVisibility";
import { SharedImageField } from "@/components/admin/SharedImageField";
import {
  AddButton,
  CollapsibleCard,
  Field,
  ListControls,
  useList,
} from "@/components/admin/AdminEditorFields";
import type { Texts } from "@/lib/content";
export function TextsEditor({
  value,
  onChange,
  onUploaded,
}: {
  value: Texts;
  onChange: (value: Texts) => void;
  onUploaded: (url: string) => void;
}) {
  const set = <K extends keyof Texts>(key: K, next: Texts[K]) =>
    onChange({ ...value, [key]: next });
  const benefits = useList(value.benefits, (next) => set("benefits", next));
  const marquee = useList(value.marquee, (next) => set("marquee", next));
  return (
    <div className="space-y-2 sm:space-y-4">
      <CollapsibleCard
        title="Visibilidad del inicio"
        summary="Elegí qué apartados aparecen en el home"
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
        title="Beneficios"
        summary={`${value.benefits.length} beneficios · debajo de los banners`}
      >
        <div className="space-y-2 md:grid md:grid-cols-3 md:items-start">
          {value.benefits.map((benefit, index) => (
            <CollapsibleCard
              key={index}
              title={`Beneficio ${index + 1}`}
              summary={benefit.t || "Sin título"}
            >
              <div className="space-y-3">
                <Field
                  label="Título"
                  value={benefit.t}
                  onChange={(next) => benefits.set(index, { t: next })}
                />
                <Field
                  label="Detalle"
                  value={benefit.d}
                  onChange={(next) => benefits.set(index, { d: next })}
                />
              </div>
            </CollapsibleCard>
          ))}
        </div>
      </CollapsibleCard>
      <CollapsibleCard title="Banner de oferta" summary="Banner con foto">
        <div className="grid gap-4 md:grid-cols-[auto_1fr]">
          <SharedImageField
            label="Foto"
            image={value.split.img}
            productId={value.split.productId}
            section="ofertas"
            onUploaded={onUploaded}
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
      <CollapsibleCard title="Banner del club" summary="Fondo verde">
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
      <CollapsibleCard title="Cinta en movimiento" summary={`${value.marquee.length} textos`}>
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
      >
        <div className="grid gap-4 md:grid-cols-[auto_1fr]">
          <SharedImageField
            label="Foto"
            image={value.editorial.img}
            productId={value.editorial.productId}
            section="marca"
            onUploaded={onUploaded}
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
