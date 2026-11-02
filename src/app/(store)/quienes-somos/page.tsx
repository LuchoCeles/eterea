import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { StoreFooter } from "@/components/store/StoreFooter";

const title = "Quiénes somos | Etérea New Concept";
const description = "Conocé por qué nació Etérea New Concept en Santa Clara del Mar y cómo elegimos las prendas que nos representan.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, type: "article" },
};

export default function AboutPage() {
  return (
    <>
      <main className="flex-1 bg-background">
        <article className="mx-auto max-w-[860px] px-5 pb-24 pt-20 sm:px-8 sm:pb-32 sm:pt-28 lg:pt-36" aria-labelledby="about-title">
          <header className="text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-accent sm:text-xs">Etérea New Concept</p>
            <h1 id="about-title" className="mt-8 font-display text-[clamp(3.25rem,8vw,6.5rem)] font-normal leading-[1.02] tracking-[-0.06em]">
              ¿Por qué <em className="font-serif font-normal text-accent">Etérea?</em>
            </h1>
          </header>

          <div className="mx-auto mt-16 max-w-[680px] border-t border-foreground/20 pt-10 text-[15px] leading-8 text-muted-foreground sm:mt-20 sm:pt-12 sm:text-lg sm:leading-9">
            <p className="text-foreground">
              Etéreo es aquello inmaterial, sublime, ligero y sutil. Algo tan delicado que parece casi intangible, como si no perteneciera a este mundo.
            </p>
            <p className="mt-8">
              Nacimos en Santa Clara del Mar, un pequeño pueblo costero de la provincia de Buenos Aires, donde crecimos respirando mar, rodeadas de naturaleza e inspiradas por sus formas y sus ciclos.
            </p>
            <p className="mt-8">
              De esta esencia nace Etérea New Concept, un espacio que refleja nuestra manera de ver la belleza, de expresarnos y de reinventarnos a través de cada etapa.
            </p>
            <p className="mt-8">
              Seleccionamos prendas que nos representan, combinando lo simple con lo diferente.
            </p>
            <p className="mt-8 font-serif text-[clamp(1.6rem,3vw,2.25rem)] italic leading-snug text-primary">
              Porque creemos que todo cambia, todo se transforma y todo fluye.
            </p>
            <p className="mt-10 font-medium text-foreground">Bienvenidas a nuestro nuevo concepto.</p>
          </div>

          <div className="mt-16 text-center sm:mt-20">
            <Link href="/productos" className="group inline-flex min-h-11 items-center gap-2 border-b border-foreground/50 text-[11px] font-medium uppercase tracking-[0.15em] transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
              Descubrí las prendas <ArrowUpRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </article>
      </main>
      <StoreFooter />
    </>
  );
}
