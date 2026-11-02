"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Save, Truck } from "lucide-react";
import { toast } from "sonner";
import { saveShippingSettingsAction } from "@/app/actions/shipping";
import type { AdminShippingSettings, ShippingSettingsInput } from "@/lib/shipping-settings";

const inputClass = "mt-2 min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
type NumericKey = "itemWeightGrams" | "packageWeightGrams" | "itemHeightCm" | "packageHeightCm" | "packageWidthCm" | "packageLengthCm";

function formFromSettings(settings: AdminShippingSettings): ShippingSettingsInput {
  return {
    environment: settings.environment, apiUser: settings.apiUser, password: "", customerId: settings.customerId,
    postalCodeOrigin: settings.postalCodeOrigin, itemWeightGrams: settings.itemWeightGrams,
    packageWeightGrams: settings.packageWeightGrams, itemHeightCm: settings.itemHeightCm,
    packageHeightCm: settings.packageHeightCm, packageWidthCm: settings.packageWidthCm,
    packageLengthCm: settings.packageLengthCm,
    freeShippingThreshold: settings.freeShippingThreshold,
  };
}

function NumericField({ label, unit, name, value, onChange }: {
  label: string; unit: string; name: NumericKey; value: number; onChange: (key: NumericKey, value: number) => void;
}) {
  return <label className="block text-sm font-medium">{label} <span className="text-muted-foreground">({unit})</span>
    <input name={name} type="number" min={1} max={unit === "g" ? 25000 : 150} step={1} required value={value || ""}
      onChange={(event) => onChange(name, Number(event.target.value))} className={inputClass} />
  </label>;
}

export function AdminShippingSettingsEditor({ initial }: { initial: AdminShippingSettings }) {
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState<ShippingSettingsInput>(formFromSettings(initial));
  const [saving, setSaving] = useState(false);
  const changed = !saved.configured || Object.entries(draft).some(([key, value]) =>
    key === "password" ? value !== "" : value !== saved[key as keyof AdminShippingSettings]);

  function setNumber(key: NumericKey, value: number) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!changed || saving) return;
    setSaving(true);
    try {
      const result = await saveShippingSettingsAction(draft);
      if ("error" in result) throw new Error(result.error);
      setSaved(result.data);
      setDraft(formFromSettings(result.data));
      toast.success("Configuración de envíos guardada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar la configuración de envíos.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="mx-auto max-w-[900px] pb-10">
    <div className="sticky top-0 z-20 -mx-5 mb-7 flex flex-wrap items-center justify-between gap-4 bg-background/95 px-5 py-4 backdrop-blur-xl sm:-mx-7 sm:px-7 lg:-mx-10 lg:px-10 xl:-mx-12 xl:px-12">
      <div>
        <h1 className="font-display text-[28px] font-semibold leading-tight sm:text-[38px]">Envíos</h1>
        <p className="mt-1 text-xs text-muted-foreground sm:text-base">Configurá el cotizador de Correo Argentino para la tienda.</p>
      </div>
      <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${saved.configured ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600"}`}>
        {saved.configured ? "Configurado" : "Configuración pendiente"}
      </span>
    </div>

    {!saved.storageReady && <p role="alert" className="mb-5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
      La página está lista, pero falta aplicar la migración de la base de datos para guardar estos datos.
    </p>}

    <form onSubmit={save} className="space-y-5">
      <fieldset disabled={saving} className="min-w-0 space-y-5 border-0 p-0">
      <section className="admin-card-surface rounded-[22px] border border-border p-5 sm:p-6">
        <div className="flex items-center gap-2"><Truck className="h-5 w-5 text-accent" /><h2 className="font-display text-2xl">Cuenta MiCorreo</h2></div>
        <p className="mt-2 text-sm text-muted-foreground">Solicitá las credenciales de API y el ID de cliente a Correo Argentino. La contraseña se guarda cifrada y no vuelve a mostrarse. <a href="https://www.correoargentino.com.ar/MiCorreo/public/paq-ar" target="_blank" rel="noreferrer" className="underline underline-offset-2">Ver cómo pedir la integración</a>.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">Ambiente
            <select value={draft.environment} onChange={(event) => setDraft((current) => ({ ...current, environment: event.target.value as "production" | "test" }))} className={inputClass}>
              <option value="production">Producción</option><option value="test">Pruebas</option>
            </select>
          </label>
          <label className="block text-sm font-medium">ID de cliente
            <input required inputMode="numeric" value={draft.customerId} onChange={(event) => setDraft((current) => ({ ...current, customerId: event.target.value.replace(/\D/g, "") }))} className={inputClass} placeholder="Número de cliente" />
          </label>
          <label className="block text-sm font-medium">Usuario de API
            <input required autoComplete="username" value={draft.apiUser} onChange={(event) => setDraft((current) => ({ ...current, apiUser: event.target.value }))} className={inputClass} placeholder="Usuario provisto por Correo Argentino" />
          </label>
          <label className="block text-sm font-medium">Contraseña de API
            <input type="password" required={!saved.passwordConfigured || draft.environment !== saved.environment || draft.apiUser !== saved.apiUser} autoComplete="new-password" value={draft.password}
              onChange={(event) => setDraft((current) => ({ ...current, password: event.target.value }))}
              className={inputClass} placeholder={saved.passwordConfigured && draft.environment === saved.environment && draft.apiUser === saved.apiUser ? "Guardada; dejá vacío para conservarla" : "Ingresá la contraseña"} />
          </label>
        </div>
      </section>

      <section className="admin-card-surface rounded-[22px] border border-border p-5 sm:p-6">
        <h2 className="font-display text-2xl">Origen del envío</h2>
        <p className="mt-2 text-sm text-muted-foreground">Usá el código postal desde el que despachás los paquetes.</p>
        <label className="mt-5 block max-w-xs text-sm font-medium">Código postal de origen
          <input required inputMode="numeric" maxLength={4} value={draft.postalCodeOrigin}
            onChange={(event) => setDraft((current) => ({ ...current, postalCodeOrigin: event.target.value.replace(/\D/g, "") }))}
            className={inputClass} placeholder="Ej.: 1414" />
        </label>
      </section>

      <section className="admin-card-surface rounded-[22px] border border-border p-5 sm:p-6">
        <h2 className="font-display text-2xl">Peso y medidas estimados</h2>
        <p className="mt-2 text-sm text-muted-foreground">El cotizador suma el peso y el alto por cada prenda al embalaje fijo. Usa un solo paquete por pedido; revisá las medidas reales antes de cobrar el envío.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <NumericField label="Peso por prenda" unit="g" name="itemWeightGrams" value={draft.itemWeightGrams} onChange={setNumber} />
          <NumericField label="Alto por prenda" unit="cm" name="itemHeightCm" value={draft.itemHeightCm} onChange={setNumber} />
          <NumericField label="Peso del embalaje" unit="g" name="packageWeightGrams" value={draft.packageWeightGrams} onChange={setNumber} />
          <NumericField label="Alto del embalaje" unit="cm" name="packageHeightCm" value={draft.packageHeightCm} onChange={setNumber} />
          <NumericField label="Ancho del paquete" unit="cm" name="packageWidthCm" value={draft.packageWidthCm} onChange={setNumber} />
          <NumericField label="Largo del paquete" unit="cm" name="packageLengthCm" value={draft.packageLengthCm} onChange={setNumber} />
        </div>
      </section>
      <section className="admin-card-surface rounded-[22px] border border-border p-5 sm:p-6">
        <h2 className="font-display text-2xl">Envío gratis</h2>
        <p className="mt-2 text-sm text-muted-foreground">Aplicá envío gratis por Correo Argentino cuando el total de prendas, con los descuentos del medio de pago elegido, alcance este monto. Dejá el campo vacío para desactivarlo. La promoción se muestra cuando las ofertas están activadas.</p>
        <label className="mt-5 block max-w-xs text-sm font-medium">Compra mínima para envío gratis ($)
          <input type="number" min={0.01} step={0.01} value={draft.freeShippingThreshold ?? ""}
            onChange={(event) => setDraft((current) => ({ ...current, freeShippingThreshold: event.target.value === "" ? null : Number(event.target.value) }))}
            className={inputClass} placeholder="Ej.: 100000" />
        </label>
      </section>
      </fieldset>
      <button type="submit" disabled={!changed || saving || !saved.storageReady} className="admin-save-button inline-flex min-h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Guardar configuración
      </button>
    </form>
  </div>;
}
