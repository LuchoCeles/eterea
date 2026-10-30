"use client";

import { useEffect, useRef, useState } from "react";

const STORAGE_NOTICE_KEY = "eterea-storage-notice-dismissed";
const EXIT_ANIMATION_MS = 220;

export function StorageNotice() {
  const [isReady, setIsReady] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const exitTimer = useRef<number | null>(null);

  useEffect(() => {
    try {
      setIsVisible(window.localStorage.getItem(STORAGE_NOTICE_KEY) !== "true");
    } catch {
      setIsVisible(true);
    }
    setIsReady(true);
  }, []);

  useEffect(() => () => {
    if (exitTimer.current) window.clearTimeout(exitTimer.current);
  }, []);

  function dismissNotice() {
    try {
      window.localStorage.setItem(STORAGE_NOTICE_KEY, "true");
    } catch {
      // El aviso se cierra en esta visita aunque el navegador bloquee el almacenamiento.
    }

    setIsDismissing(true);
    exitTimer.current = window.setTimeout(() => setIsVisible(false), EXIT_ANIMATION_MS);
  }

  if (!isReady || !isVisible) return null;

  return (
    <div className="storage-notice-position pointer-events-none fixed inset-x-3 z-40 mx-auto max-w-[460px] sm:inset-x-auto sm:right-6 sm:max-w-[420px]">
      <aside
        aria-labelledby="storage-notice-title"
        className={`pointer-events-auto border border-foreground/10 bg-card/95 p-4 text-card-foreground shadow-[0_12px_36px_-18px_rgba(45,38,31,0.35)] backdrop-blur-md sm:p-5 motion-reduce:animate-none ${
          isDismissing
            ? "translate-y-2 opacity-0 transition-[opacity,transform] duration-200 ease-in"
            : "animate-rise"
        }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
          <div className="min-w-0">
            <h2 id="storage-notice-title" className="font-display text-lg font-medium leading-tight">
              Tu experiencia en Etérea
            </h2>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">
              Usamos almacenamiento local para recordar que leíste este aviso. El carrito se conserva durante esta visita, pero no entre visitas.
            </p>
          </div>
          <button
            type="button"
            onClick={dismissNotice}
            className="min-h-11 self-end bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:shrink-0"
          >
            Entendido
          </button>
        </div>
      </aside>
    </div>
  );
}
