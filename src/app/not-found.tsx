import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { NotFoundScene } from "@/components/store/NotFoundScene";

export const metadata: Metadata = {
  title: "Página no encontrada | Etérea",
};

export default function NotFound() {
  return (
    <div className="relative isolate flex min-h-svh flex-col overflow-x-hidden bg-background text-foreground lg:h-svh">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <span className="absolute left-1/2 top-[56%] -translate-x-1/2 -translate-y-1/2 font-display text-[clamp(13rem,64vw,26rem)] leading-[0.72] tracking-[-0.08em] text-primary/[0.12] sm:left-[3%] sm:translate-x-0 sm:text-[clamp(18rem,27vw,32rem)]">404</span>
      </div>

      <header className="relative z-10 shrink-0 border-b border-foreground/10">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:h-20 sm:px-6 lg:px-10">
          <Link href="/" aria-label="Etérea, ir al inicio" className="group inline-flex flex-col items-center leading-none">
            <span className="font-display text-[1.9rem] tracking-[0.08em] transition-colors group-hover:text-accent sm:text-[2.3rem]">Etérea</span>
            <span className="mt-1 text-[8px] font-medium uppercase tracking-[0.42em] text-muted-foreground">New Concept</span>
          </Link>
          <Link href="/productos" className="group inline-flex shrink-0 items-center gap-1.5 border-b border-foreground/30 pb-1 text-[11px] font-medium uppercase tracking-[0.1em] transition-colors hover:border-accent hover:text-accent sm:gap-2 sm:text-sm sm:tracking-[0.13em]">
            Ver prendas <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-[1600px] flex-1 items-center gap-7 px-4 py-7 sm:gap-10 sm:px-6 sm:py-10 lg:min-h-0 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-8 lg:px-10 lg:py-2 xl:gap-12">
        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-accent">
            <span className="h-px w-8 bg-accent" aria-hidden="true" />
            Error 404 · Un pequeño desvío
          </div>
          <h1 className="mt-5 font-display text-[clamp(2.65rem,13vw,3.4rem)] font-normal leading-[0.98] tracking-[-0.035em] sm:mt-7 sm:text-[clamp(4rem,8vw,6.5rem)] lg:mt-3 lg:text-[clamp(2.25rem,9svh,6.2rem)] lg:leading-[0.95]">
            Esta página<br />{" "}se fue con<br />{" "}<em className="font-normal text-accent">la marea.</em>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-muted-foreground sm:mt-8 sm:text-base sm:leading-8 lg:mt-3 lg:leading-7">
            Parece que llegaste a una orilla que todavía no existe. Volvé al inicio o seguí explorando las prendas de Etérea.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 sm:mt-9 sm:gap-4 lg:mt-4">
            <Link href="/" className="group inline-flex min-h-11 items-center justify-center gap-2 bg-primary px-4 py-2.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:min-h-12 sm:gap-5 sm:px-6 sm:py-3 sm:text-sm">
              Volver al inicio <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <Link href="/productos" className="inline-flex min-h-11 items-center border-b border-foreground/40 px-1 text-xs font-medium transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:min-h-12 sm:text-sm">
              Descubrí las prendas
            </Link>
          </div>
        </div>

        <div className="relative min-w-0 sm:max-w-[620px] lg:w-full lg:max-w-[90svh] lg:justify-self-end" aria-hidden="true">
          <div className="relative overflow-hidden border border-foreground/10 bg-sea shadow-[0_25px_80px_-60px_rgba(67,55,40,0.45)]">
            <NotFoundScene />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 border-t border-foreground/10 bg-background/85 px-3 py-2 text-[8px] font-medium uppercase tracking-[0.1em] text-muted-foreground backdrop-blur-sm sm:px-5 sm:py-3 sm:text-xs sm:tracking-[0.18em]">
              <span>Espíritu costero</span>
              <span>Etérea · New Concept</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 shrink-0 border-t border-foreground/10 px-4 py-3 text-center text-xs text-muted-foreground sm:px-6 lg:px-10">
        Inspirada en el mar, hecha para acompañarte.
      </footer>
    </div>
  );
}
