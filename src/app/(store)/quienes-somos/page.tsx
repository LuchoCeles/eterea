import type { Metadata } from "next";
import Image from "next/image";
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
        <article className="mx-auto grid max-w-[1440px] gap-12 px-5 pb-24 pt-10 sm:px-8 sm:pb-28 sm:pt-16 lg:grid-cols-2 lg:gap-16 lg:px-12 lg:pb-32 lg:pt-20 xl:gap-24 xl:px-16" aria-labelledby="about-title">
          <figure className="relative aspect-[4/5] w-full overflow-hidden bg-[#e8d8c6] lg:aspect-auto lg:min-h-[760px]">
            <Image
              src="/assets/quienes-somos.webp"
              alt="Mujer con vestido claro entre margaritas y pastos altos"
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </figure>

          <div className="lg:pt-8">
            <header>
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-accent sm:text-xs">Etérea New Concept</p>
              <h1 id="about-title" className="mt-7 font-display text-[clamp(3.25rem,6vw,5.75rem)] font-normal leading-[1.02] tracking-[-0.06em]">
                ¿Por qué <em className="font-serif font-normal text-accent">Etérea?</em>
              </h1>
            </header>

            <div className="mt-10 border-t border-foreground/20 pt-8 text-[15px] leading-8 text-muted-foreground sm:mt-12 sm:pt-10 sm:text-lg sm:leading-9">
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
              <p className="mt-8 font-sans text-[clamp(1.6rem,3vw,2.25rem)] font-medium italic leading-snug tracking-[-0.035em] text-primary">
                Porque creemos que todo cambia, todo se transforma y todo fluye.
              </p>
              <p className="mt-10 font-medium text-foreground">Bienvenidas a nuestro nuevo concepto.</p>
            </div>

            <div className="mt-12 sm:mt-16">
              <Link href="/productos" className="group inline-flex min-h-11 items-center gap-2 border-b border-foreground/50 text-[11px] font-medium uppercase tracking-[0.15em] transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                Descubrí las prendas <ArrowUpRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </article>
      </main>
      <StoreFooter />
    </>
  );
}
