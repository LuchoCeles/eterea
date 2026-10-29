"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CollapsibleCard } from "@/components/admin/AdminEditorFields";

type ConnectionStatus = "loading" | "saved" | "missing" | "error";
type VerifiedAccount = { username: string; accountId: string; sampleCount: number };

export function InstagramConnection() {
  const [status, setStatus] = useState<ConnectionStatus>("loading");
  const [token, setToken] = useState("");
  const [accountId, setAccountId] = useState("");
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [verifiedAccount, setVerifiedAccount] = useState<VerifiedAccount | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/instagram", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("No se pudo consultar la conexión.");
        return response.json() as Promise<{ saved: boolean; username: string | null; accountId: string | null }>;
      })
      .then((result) => {
        setUsername(result.username);
        setAccountId(result.accountId ?? "");
        setStatus(result.saved ? "saved" : "missing");
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus("error");
      });
    return () => controller.abort();
  }, []);

  async function validate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token.trim() || !accountId.trim()) return;
    setVerifiedAccount(null);
    setSaving(true);
    try {
      const response = await fetch("/api/admin/instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim(), accountId: accountId.trim() }),
      });
      const result = (await response.json()) as { valid?: boolean; username?: string; accountId?: string; sampleCount?: number; error?: string };
      if (!response.ok || !result.valid || !result.username || !result.accountId) throw new Error(result.error || "No se pudo validar la cuenta.");
      setVerifiedAccount({ username: result.username, accountId: result.accountId, sampleCount: result.sampleCount ?? 0 });
      toast.success("La cuenta respondió correctamente. Revisá el usuario antes de confirmar.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo validar la cuenta.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmSave() {
    if (!verifiedAccount || !token.trim()) return;
    setSaving(true);
    try {
      const response = await fetch("/api/admin/instagram", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim(), accountId: verifiedAccount.accountId, confirmUsername: verifiedAccount.username }),
      });
      const result = (await response.json()) as { saved?: boolean; username?: string; accountId?: string; error?: string };
      if (!response.ok || !result.saved) throw new Error(result.error || "No se pudo guardar la conexión.");
      setToken("");
      setVerifiedAccount(null);
      setStatus("saved");
      setUsername(result.username ?? null);
      setAccountId(result.accountId ?? verifiedAccount.accountId);
      toast.success("Conexión guardada. El Home podrá mostrar las últimas publicaciones de la cuenta.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar la conexión.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CollapsibleCard
      title="Conexión automática con Instagram"
      summary={status === "saved" ? (username ? `Cuenta conectada: @${username}` : "Cuenta conectada") : "Vinculá una cuenta"}
    >
      <form onSubmit={validate} className="space-y-4">
        <p className="text-sm text-muted-foreground">Ingresá el token de acceso de Meta y el ID de la cuenta profesional que querés mostrar en el Home. El token se valida antes de guardarse.</p>
        <p className="text-sm" role="status">
          {status === "loading" && "Consultando conexión…"}
          {status === "saved" && (username ? `Cuenta vinculada: @${username}. Ingresá un nuevo token e ID solo si necesitás reemplazar la conexión.` : "Cuenta vinculada. Ingresá un nuevo token e ID solo si necesitás reemplazar la conexión.")}
          {status === "missing" && "Todavía no hay una cuenta conectada."}
          {status === "error" && "No se pudo consultar el estado de la conexión."}
        </p>
        <div className="space-y-3">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={accountId}
            disabled={status === "loading" || saving}
            onChange={(event) => { setAccountId(event.target.value); setVerifiedAccount(null); }}
            placeholder="ID de la cuenta de Instagram"
            aria-label="ID de la cuenta de Instagram"
            className="min-h-11 w-full border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
          />
          <input
            type="password"
            autoComplete="new-password"
            value={token}
            disabled={status === "loading" || saving}
            onChange={(event) => { setToken(event.target.value); setVerifiedAccount(null); }}
            placeholder="Token de acceso de Meta"
            aria-label="Token de acceso de Meta"
            className="min-h-11 w-full border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
          />
        </div>
        {(token.trim() || saving) && <Button type="submit" disabled={saving || !token.trim() || !accountId.trim()}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} {" "}Validar cuenta
        </Button>}
        {verifiedAccount && <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4" role="status">
          <div>
            <p className="text-sm font-medium">Meta identificó a @{verifiedAccount.username}</p>
            <p className="mt-1 text-xs text-muted-foreground">ID {verifiedAccount.accountId} · {verifiedAccount.sampleCount ? "Feed accesible: se leyó una publicación de muestra." : "Feed accesible: Meta no devolvió publicaciones en la muestra."}</p>
            <p className="mt-2 text-sm text-muted-foreground">Confirmá que sea la cuenta que querés vincular.</p>
          </div>
          <Button type="button" onClick={confirmSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} {" "}Confirmar y guardar conexión
          </Button>
        </div>}
      </form>
    </CollapsibleCard>
  );
}
