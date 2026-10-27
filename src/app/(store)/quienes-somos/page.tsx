import type { Metadata } from "next";
import Link from "next/link";
import { StoreFooter } from "@/components/store/StoreFooter";

const title = "Quiénes somos | Etérea New Concept";
const description = "Etéreo es aquello inmaterial, sublime, ligero y sutil. Nacimos en Santa Clara del Mar, un pequeño pueblo costero de la provincia de Buenos Aires.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, type: "article" },
};

export default function AboutPage() {
  return (
    <>
      <main>
        <section className="bg-background px-4 py-16 sm:px-6 md:py-24">
          <article className="mx-auto max-w-[1040px]">
            <p className="eyebrow text-muted-foreground">ETÉREA NEW CONCEPT</p>
            <h1 className="mt-4 font-display text-4xl font-normal leading-tight sm:text-5xl md:text-6xl">¿Por qué Etérea?</h1>
            <div className="mt-8 grid gap-6 border-t border-border pt-8 text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8 md:grid-cols-2 md:gap-12">
              <div className="space-y-6">
                <p>Etéreo es aquello inmaterial, sublime, ligero y sutil. Algo tan delicado que parece casi intangible, como si no perteneciera a este mundo.</p>
                <p>Nacimos en Santa Clara del Mar, un pequeño pueblo costero de la provincia de Buenos Aires, donde crecimos respirando mar, rodeadas de naturaleza e inspiradas por sus formas y sus ciclos.</p>
                <p>De esta esencia nace Etérea New Concept, un espacio que refleja nuestra manera de ver la belleza, de expresarnos y de reinventarnos a través de cada etapa.</p>
              </div>
              <div className="space-y-6">
                <p>Seleccionamos prendas que nos representan, combinando lo simple con lo diferente.</p>
                <p>Porque creemos que todo cambia, todo se transforma y todo fluye.</p>
                <p className="border-l-2 border-accent pl-5 font-medium text-foreground">Bienvenidas a nuestro nuevo concepto.</p>
              </div>
            </div>
            <div className="mt-10 border-t border-border pt-6">
              <Link href="/productos" className="inline-flex min-h-11 items-center border-b border-foreground text-sm font-medium hover:text-accent">
                Ver prendas
              </Link>
            </div>
          </article>
        </section>
      </main>
      <StoreFooter />
    </>
  );
}
