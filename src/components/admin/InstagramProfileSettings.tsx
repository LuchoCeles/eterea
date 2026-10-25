"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { saveContent, useContent, useContentUpdater } from "@/components/providers/ContentProvider";
import { CollapsibleCard } from "@/components/admin/AdminEditorFields";
import { Button } from "@/components/ui/button";
import { instagramProfileUrl } from "@/lib/storefront-rules";

export function InstagramProfileSettings() {
  const contact = useContent("contact");
  const updateContent = useContentUpdater();
  const [username, setUsername] = useState(contact.instagramUsername);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => setUsername(contact.instagramUsername), [contact.instagramUsername]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = username.trim().replace(/^@/, "");
    if (clean && !instagramProfileUrl(clean)) {
      setMessage("Ingresá un usuario de Instagram válido, sin enlace ni espacios.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const data = { ...contact, instagramUsername: clean };
      await saveContent("contact", data);
      updateContent("contact", data);
      setMessage("Usuario público guardado.");
    } catch {
      setMessage("No se pudo guardar el usuario. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CollapsibleCard title="Perfil público de Instagram" summary={contact.instagramUsername ? `@${contact.instagramUsername}` : "Sin usuario configurado"}>
      <form onSubmit={save} className="space-y-4">
        <p className="text-sm text-muted-foreground">Este usuario se usa para los enlaces públicos cuando la cuenta todavía no está conectada o Meta no responde. Si la cuenta está vinculada, se usa su nombre actual automáticamente.</p>
        <input value={username} onChange={(event) => setUsername(event.target.value)} aria-label="Usuario público de Instagram" placeholder="usuario.de.instagram" className="min-h-11 w-full border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground" />
        <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Guardar usuario</Button>
        {message && <p role="status" className="text-sm">{message}</p>}
      </form>
    </CollapsibleCard>
  );
}
