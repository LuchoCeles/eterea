"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CollapsibleCard } from "@/components/admin/AdminEditorFields";

type ConnectionStatus = "loading" | "saved" | "missing" | "error";

export function InstagramConnection() {
  const [status, setStatus] = useState<ConnectionStatus>("loading");
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/instagram", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("No se pudo consultar la conexión.");
        return response.json() as Promise<{ saved: boolean }>;
      })
      .then((result) => setStatus(result.saved ? "saved" : "missing"))
      .catch(() => {
        if (!controller.signal.aborted) setStatus("error");
      });
    return () => controller.abort();
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token.trim()) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/instagram", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      });
      const result = (await response.json()) as { saved?: boolean; error?: string };
      if (!response.ok) throw new Error(result.error || "No se pudo guardar el token.");
      setToken("");
      setStatus("saved");
      setMessage("Token guardado. Las publicaciones recientes aparecerán en el home.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo guardar el token.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CollapsibleCard
      title="Conexión automática con Instagram"
      summary={status === "saved" ? "Cuenta conectada" : "Vinculá @eterea.newconcept"}
    >
      <form onSubmit={save} className="space-y-4">
        <p className="text-sm" role="status">
          {status === "loading" && "Consultando conexión…"}
          {status === "saved" &&
            "Token guardado. Ingresá otro solamente si necesitás reemplazarlo."}
          {status === "missing" && "Todavía no hay un token guardado."}
          {status === "error" && "No se pudo consultar el estado de la conexión."}
        </p>
        <div>
          <input
            type="password"
            autoComplete="new-password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Pegá el token de Meta"
            aria-label="Token de acceso de Instagram"
            className="min-h-11 w-full border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
          />
        </div>
        <Button type="submit" disabled={saving || !token.trim()}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}{" "}
          {status === "saved" ? "Reemplazar token" : "Guardar token"}
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
