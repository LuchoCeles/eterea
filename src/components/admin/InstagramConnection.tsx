"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { disconnectInstagramAction, instagramStatusAction, saveInstagramAction, validateInstagramAction } from "@/app/actions/instagram";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { CollapsibleCard } from "@/components/admin/AdminEditorFields";

type ConnectionStatus = "loading" | "saved" | "missing" | "error";
type VerifiedAccount = { username: string; accountId: string; sampleCount: number };

export function InstagramConnection({ initial }: { initial: { saved: boolean; username: string | null; error?: boolean } }) {
  const [status, setStatus] = useState<ConnectionStatus>(initial.error ? "error" : initial.saved ? "saved" : "missing");
  const [token, setToken] = useState("");
  const [accountId, setAccountId] = useState("");
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState<string | null>(initial.username);
  const [verifiedAccount, setVerifiedAccount] = useState<VerifiedAccount | null>(null);

  async function retryStatus() {
    setStatus("loading");
    const result = await instagramStatusAction().catch(() => ({ error: "No se pudo consultar la conexión." }));
    if ("error" in result) {
      setStatus("error");
      return;
    }
    setUsername(result.data.username);
    setStatus(result.data.saved ? "saved" : "missing");
  }

  async function validate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token.trim() || !accountId.trim()) return;
    setVerifiedAccount(null);
    setSaving(true);
    try {
      const result = await validateInstagramAction({ token: token.trim(), accountId: accountId.trim() });
      if ("error" in result) throw new Error(result.error);
      setVerifiedAccount(result.data);
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
      const result = await saveInstagramAction({ token: token.trim(), accountId: verifiedAccount.accountId, confirmUsername: verifiedAccount.username });
      if ("error" in result) throw new Error(result.error);
      setToken("");
      setVerifiedAccount(null);
      setStatus("saved");
      setUsername(result.data.username);
      setAccountId("");
      toast.success("Conexión guardada. El Home podrá mostrar las últimas publicaciones de la cuenta.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar la conexión.");
    } finally {
      setSaving(false);
    }
  }

  async function disconnect() {
    setSaving(true);
    try {
      const result = await disconnectInstagramAction();
      if ("error" in result) throw new Error(result.error);
      setToken("");
      setAccountId("");
      setVerifiedAccount(null);
      setUsername(null);
      setStatus("missing");
      toast.success("Cuenta desvinculada. Ya podés configurar otro Instagram.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo desvincular la cuenta.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CollapsibleCard
      title="Conexión automática con Instagram"
      summary={status === "saved" ? (username ? `Cuenta conectada: @${username}` : "Cuenta conectada") : status === "missing" ? "Vinculá una cuenta" : status === "loading" ? "Consultando conexión…" : "No se pudo consultar"}
    >
      <div className="space-y-4">
        <p className="text-sm" role="status">
          {status === "loading" && "Consultando conexión…"}
          {status === "saved" && (username ? `Cuenta vinculada: @${username}. Este usuario se usa automáticamente en la tienda.` : "Cuenta vinculada. El usuario de la cuenta se usa automáticamente en la tienda.")}
          {status === "missing" && "Todavía no hay una cuenta conectada."}
          {status === "error" && "No se pudo consultar el estado de la conexión."}
        </p>
        {status === "error" && <Button type="button" variant="outline" onClick={() => void retryStatus()}>
          Reintentar consulta
        </Button>}
        {status === "saved" && <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="outline" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Desvincular y cambiar cuenta
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Desvincular {username ? `@${username}` : "la cuenta de Instagram"}?</AlertDialogTitle>
              <AlertDialogDescription>
                Se quitará el token guardado y dejarán de mostrarse el usuario y las publicaciones de esta cuenta. Después podrás conectar otra cuenta.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={disconnect}>Sí, desvincular cuenta</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>}
        {status === "missing" && <form onSubmit={validate} className="space-y-4">
          <p className="text-sm text-muted-foreground">Ingresá el token de acceso de Meta y el ID de la cuenta profesional que querés mostrar en el Home. El token se valida antes de guardarse.</p>
          <div className="space-y-3">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={accountId}
              disabled={saving}
              onChange={(event) => { setAccountId(event.target.value); setVerifiedAccount(null); }}
              placeholder="ID de la cuenta de Instagram"
              aria-label="ID de la cuenta de Instagram"
              className="min-h-11 w-full border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
            />
            <input
              type="password"
              autoComplete="new-password"
              value={token}
              disabled={saving}
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
        </form>}
      </div>
    </CollapsibleCard>
  );
}
