"use client";

import { Field } from "@/components/admin/AdminEditorFields";
import type { HowToBuyContent } from "@/lib/content";

export function AdminHowToBuyEditor({
  value,
  onChange,
}: {
  value: HowToBuyContent;
  onChange: (value: HowToBuyContent) => void;
}) {
  const update = (patch: Partial<HowToBuyContent>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-2xl border border-border p-4 sm:grid-cols-2 sm:p-5">
        <Field label="Texto superior" value={value.eyebrow} onChange={(eyebrow) => update({ eyebrow })} />
        <Field label="Título" value={value.title} onChange={(title) => update({ title })} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <section className="space-y-3 rounded-2xl border border-border p-4 sm:p-5">
          <h3 className="font-display text-xl">Paso 1</h3>
          <Field label="Título" value={value.firstStepTitle} onChange={(firstStepTitle) => update({ firstStepTitle })} />
          <Field label="Descripción" value={value.firstStepDescription} multiline onChange={(firstStepDescription) => update({ firstStepDescription })} />
        </section>
        <section className="space-y-3 rounded-2xl border border-border p-4 sm:p-5">
          <h3 className="font-display text-xl">Paso 2</h3>
          <Field label="Título" value={value.secondStepTitle} onChange={(secondStepTitle) => update({ secondStepTitle })} />
          <Field label="Descripción" value={value.secondStepDescription} multiline onChange={(secondStepDescription) => update({ secondStepDescription })} />
        </section>
      </div>
      <section className="grid gap-3 rounded-2xl border border-border p-4 sm:grid-cols-2 sm:p-5">
        <h3 className="font-display text-xl sm:col-span-2">Aviso importante</h3>
        <Field label="Título del aviso" value={value.noticeTitle} onChange={(noticeTitle) => update({ noticeTitle })} />
        <Field label="Texto del aviso" value={value.noticeText} multiline onChange={(noticeText) => update({ noticeText })} />
      </section>
    </div>
  );
}
