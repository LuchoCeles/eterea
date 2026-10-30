"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AuthForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
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
    <main className="grid flex-1 place-items-center bg-background px-4 py-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 border bg-card p-6 sm:space-y-5 sm:p-8">
        <div>
          <img src="/assets/eterea-placeholder.svg" alt="Etérea New Concept" className="mx-auto mb-4 h-20 w-48 object-contain sm:mb-6 sm:h-24" />
          <span className="eyebrow text-muted-foreground">Panel Etérea</span>
          <h1 className="mt-2 text-3xl font-semibold">Ingresar</h1>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">Ingresá tus credenciales para administrar la tienda.</p>
        </div>
        <input type="text" required maxLength={191} autoComplete="username" placeholder="Usuario" aria-label="Usuario" value={username} onChange={(event) => setUsername(event.target.value)} className="w-full border bg-background px-3 py-2.5 text-sm" />
        <div className="relative">
          <input id="auth-password" type={passwordVisible ? "text" : "password"} required maxLength={128} autoComplete="current-password" placeholder="Contraseña" aria-label="Contraseña" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full border bg-background py-2.5 pl-3 pr-12 text-sm" />
          <button type="button" aria-controls="auth-password" aria-label={passwordVisible ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={passwordVisible} onClick={() => setPasswordVisible((visible) => !visible)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring">
            {passwordVisible ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
          </button>
        </div>
        {message && <p role="alert" className="text-sm text-accent">{message}</p>}
        <Button disabled={busy} className="h-11 w-full">{busy ? "Un momento…" : "Ingresar"}</Button>
      </form>
    </main>
  );
}
