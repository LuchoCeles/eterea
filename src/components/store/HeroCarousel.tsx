"use client";

import { useEffect, useState } from "react";
import { useContent } from "@/components/providers/ContentProvider";
import { resolveImageSource } from "@/lib/image-source";
import { Button } from "@/components/ui/button";
import { visibleAnnouncements } from "@/lib/storefront-rules";
import { ArrowRight } from "lucide-react";

const DUR = 6000;

export function HeroCarousel() {
  const slides = useContent("hero");
  const products = useContent("products");
  const { offers, homeSections } = useContent("texts");
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setI((v) => (v + 1) % Math.max(slides.length, 1)), DUR);
    return () => clearTimeout(t);
  }, [i, slides.length]);

  if (!homeSections.hero || !slides.length) return null;
  const current = i % slides.length;
  return (
    <section aria-label="Colección Etérea" className="relative h-[72svh] min-h-[510px] max-h-[820px] w-full overflow-hidden bg-pearl">
      {slides.map((s, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-1000 ${idx === current ? "opacity-100" : "pointer-events-none opacity-0"}`}
          aria-hidden={idx !== current}
        >
          <img
            src={resolveImageSource(s, products)}
            alt={s.title}
            width={1920}
            height={1088}
            className={`h-full w-full object-cover transition-transform duration-[7000ms] ${s.align === "right" ? "object-[28%_center]" : "object-[67%_center]"} md:object-center ${idx === current ? "scale-105" : "scale-100"}`}
          />
          {idx === current && (
            <div
              className={`absolute bottom-16 flex w-full max-w-2xl flex-col gap-4 px-6 text-photo-paper md:bottom-24 md:w-[48%] md:px-16 md:text-photo-ink ${
                s.align === "right" ? "right-0 items-end text-right" : "left-0"
              }`}
            >
              <span className="eyebrow animate-rise">{s.kicker}</span>
              <h1 className="animate-rise text-6xl font-normal leading-none md:text-8xl" >
                {s.title}
              </h1>
              <p className="animate-rise max-w-xs text-sm leading-relaxed md:text-base">Una mirada al mar. Una forma de vestir.</p>
              <div className="flex animate-rise flex-wrap items-center gap-4">
                <Button asChild variant="outline" className="mt-3 h-12 rounded-none border-photo-ink/30 bg-photo-paper px-6 text-photo-ink hover:bg-primary hover:text-primary-foreground"><a href="#nuevo">{s.cta}<ArrowRight /></a></Button>
                {visibleAnnouncements([s.promo], offers.enabled).length > 0 && <span className="text-xs uppercase">{s.promo}</span>}
              </div>
            </div>
          )}
        </div>
      ))}

      <div className="absolute bottom-6 left-6 right-6 flex gap-2 md:left-16 md:right-16">
        {slides.map((s, idx) => (
          <Button variant="ghost" key={idx} onClick={() => setI(idx)} aria-label={`Ver banner ${idx + 1}`} aria-pressed={idx === current} className="h-8 flex-1 rounded-none px-0 hover:bg-transparent">
            <span className="block h-[2px] w-full overflow-hidden bg-photo-paper/40">
              {idx === current && <span key={current} className="animate-progress block h-full bg-photo-paper" />}
              {idx < current && <span className="block h-full bg-photo-paper" />}
            </span>
          </Button>
        ))}
      </div>
    </section>
  );
}
