import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { AboutScene } from "@/components/store/AboutScene";
import { StoreFooter } from "@/components/store/StoreFooter";
import styles from "./about.module.css";

const title = "Quiénes somos | Etérea New Concept";
const description = "Etérea nació en Santa Clara del Mar. Conocé nuestra forma de sentir la moda, la naturaleza y las prendas que acompañan cada etapa.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, type: "article" },
};

export default function AboutPage() {
  return (
    <>
      <main className="overflow-hidden bg-background">
        <section className="mx-auto flex max-w-[1080px] flex-col items-center px-5 pb-14 pt-20 text-center sm:px-8 sm:pb-20 sm:pt-28 lg:pt-32" aria-labelledby="about-title">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-accent sm:text-xs">Etérea New Concept · Santa Clara del Mar</p>
          <h1 id="about-title" className="mt-8 max-w-[950px] font-display text-[clamp(3.25rem,8vw,7.25rem)] font-normal leading-[0.98] tracking-[-0.065em]">
            Vestir también es <br className="hidden sm:block" />una forma de <em className="font-serif font-normal text-accent">ser.</em>
          </h1>
          <p className="mt-8 max-w-[560px] text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">
            Nacimos cerca del mar para elegir prendas que se sientan propias. Ropa simple, diferente y libre para acompañarte en cada etapa.
          </p>
          <Link href="#nuestra-historia" className="group mt-10 inline-flex min-h-11 items-center gap-2 border-b border-foreground/40 text-[11px] font-medium uppercase tracking-[0.15em] transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
            Conocé nuestra historia <ArrowDown aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-y-1" />
          </Link>
        </section>

        <div className="relative overflow-hidden bg-sea/45" aria-hidden="true">
          <div className={styles.scene}>
            <AboutScene />
          </div>
        </div>

        <section id="nuestra-historia" className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28 lg:py-32" aria-labelledby="story-title">
          <div className="mx-auto grid max-w-[1160px] gap-10 border-t border-foreground/20 pt-9 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-24 lg:pt-12">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-accent">01 / Nuestra historia</p>
              <h2 id="story-title" className="mt-8 max-w-[510px] font-display text-[clamp(2.7rem,5vw,4.75rem)] font-normal leading-[1.05] tracking-[-0.05em]">
                De la costa, <em className="font-serif font-normal text-accent">a tu manera.</em>
              </h2>
            </div>
            <div className="max-w-[570px] space-y-6 text-sm leading-8 text-muted-foreground sm:text-base sm:leading-9 lg:pt-12">
              <p>Etéreo es aquello ligero y sutil, casi intangible. Esa sensación nos acompaña desde Santa Clara del Mar, donde crecimos entre la naturaleza, sus formas y sus ciclos.</p>
              <p>Así nació Etérea: un espacio para expresarnos y reinventarnos. Seleccionamos prendas que combinan lo simple con lo diferente, porque creemos que todo cambia, se transforma y fluye.</p>
              <p className="font-medium text-foreground">Queremos que encuentres algo que se sienta tan tuyo como tu propia forma de ser.</p>
            </div>
          </div>
        </section>

        <section className="border-t border-foreground/10 bg-pearl px-5 py-16 text-center sm:px-8 sm:py-20" aria-label="Explorá Etérea">
          <p className="font-serif text-[clamp(1.75rem,3vw,2.6rem)] italic leading-tight text-primary">Lo simple. Lo diferente. Lo tuyo.</p>
          <Link href="/productos" className="group mt-7 inline-flex min-h-11 items-center gap-2 border-b border-foreground/50 text-[11px] font-medium uppercase tracking-[0.15em] transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
            Descubrí las prendas <ArrowUpRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </section>
      </main>
      <StoreFooter />
    </>
  );
}
