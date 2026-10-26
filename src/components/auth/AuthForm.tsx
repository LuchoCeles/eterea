"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function AuthForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    }).catch(() => null);
    const result = await response?.json().catch(() => null);
    setBusy(false);
    if (!response?.ok) {
      setMessage(result?.error ?? "No se pudo iniciar sesión. Probá de nuevo.");
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 border bg-card p-8">
        <div>
          <img src="/assets/eterea-placeholder.svg" alt="Etérea New Concept" className="mx-auto mb-6 h-24 w-48 object-contain" />
          <span className="eyebrow text-muted-foreground">Panel Etérea</span>
          <h1 className="mt-2 text-3xl font-semibold">Ingresar</h1>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">Ingresá tus credenciales para administrar la tienda.</p>
        </div>
        <input type="text" required maxLength={191} autoComplete="username" placeholder="Usuario" aria-label="Usuario" value={username} onChange={(event) => setUsername(event.target.value)} className="w-full border bg-background px-3 py-2.5 text-sm" />
        <input type="password" required maxLength={128} autoComplete="current-password" placeholder="Contraseña" aria-label="Contraseña" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full border bg-background px-3 py-2.5 text-sm" />
        {message && <p role="alert" className="text-sm text-accent">{message}</p>}
        <Button disabled={busy} className="h-11 w-full">{busy ? "Un momento…" : "Ingresar"}</Button>
      </form>
    </main>
  );
}
