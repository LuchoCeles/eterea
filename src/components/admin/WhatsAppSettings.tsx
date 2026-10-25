"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { saveContent, useContent, useContentUpdater } from "@/components/providers/ContentProvider";
import { Button } from "@/components/ui/button";
import { CollapsibleCard } from "@/components/admin/AdminEditorFields";
import { normalizeWhatsAppNumber } from "@/lib/storefront-rules";

export function WhatsAppSettings() {
  const contact = useContent("contact");
  const updateContent = useContentUpdater();
  const [phone, setPhone] = useState(contact.whatsapp);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => setPhone(contact.whatsapp), [contact.whatsapp]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (phone.trim() && !normalizeWhatsAppNumber(phone)) {
      setMessage("Ingresá un número internacional válido, con código de país y área.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const data = { whatsapp: phone.trim() };
      await saveContent("contact", data);
      updateContent("contact", data);
      setMessage(data.whatsapp ? "Número de WhatsApp guardado." : "Número de WhatsApp eliminado.");
    } catch {
      setMessage("No se pudo guardar el número. Revisá la conexión e intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CollapsibleCard
      title="WhatsApp para pedidos"
      summary={contact.whatsapp || "Todavía no hay un número configurado"}
    >
      <form onSubmit={save} className="space-y-4">
        <div>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+54 9 11 1234-5678"
            aria-label="Número de WhatsApp"
            className="min-h-11 w-full border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
          />
        </div>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Guardar número
        </Button>
        {message && (
          <p role="status" className="text-sm">
            {message}
          </p>
        )}
      </form>
    </CollapsibleCard>
  );
}
