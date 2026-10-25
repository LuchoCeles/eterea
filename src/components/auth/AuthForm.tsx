"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const response = await fetch(`/api/auth/${mode === "in" ? "login" : "register"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
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
          <h1 className="mt-2 text-3xl font-semibold">{mode === "in" ? "Ingresar" : "Crear cuenta"}</h1>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">Acceso para administrar la tienda. No necesitás una cuenta para explorar las prendas.</p>
        </div>
        <input type="email" required maxLength={191} placeholder="Email" aria-label="Email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full border bg-background px-3 py-2.5 text-sm" />
        <input type="password" required minLength={mode === "up" ? 8 : 1} maxLength={128} placeholder="Contraseña" aria-label="Contraseña" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full border bg-background px-3 py-2.5 text-sm" />
        {message && <p role="alert" className="text-sm text-accent">{message}</p>}
        <Button disabled={busy} className="h-11 w-full">{busy ? "Un momento…" : mode === "in" ? "Ingresar" : "Crear cuenta"}</Button>
        <Button variant="link" type="button" onClick={() => { setMode(mode === "in" ? "up" : "in"); setMessage(null); }} className="w-full text-xs text-muted-foreground underline">
          {mode === "in" ? "¿Primera vez? Creá tu cuenta" : "Ya tengo cuenta"}
        </Button>
      </form>
    </main>
  );
}
