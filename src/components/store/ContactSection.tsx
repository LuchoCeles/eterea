import { Instagram, MessageCircle, Phone } from "lucide-react";

const instagramUrl = "https://www.instagram.com/eterea.newconcept/";
const whatsappMessage = "¡Hola! Estuve viendo la web de Etérea y me gustaría hacer una consulta.";
const whatsappUrl = "https://wa.me/5492234495025?text=" + encodeURIComponent(whatsappMessage);

function WhatsAppIcon() {
  return (
    <span className="relative inline-flex h-5 w-5 items-center justify-center" aria-hidden="true">
      <MessageCircle className="h-5 w-5" strokeWidth={1.8} />
      <Phone className="absolute h-2.5 w-2.5 -translate-y-px" strokeWidth={2} />
    </span>
  );
}

export function ContactSection() {
  return (
    <section id="contacto" aria-labelledby="contact-title" className="border-t bg-background px-4 py-16 sm:px-6 md:py-24">
      <div className="mx-auto max-w-[1000px] text-center">
        <p className="eyebrow text-accent">Sigamos en contacto</p>
        <h2 id="contact-title" className="mt-3 font-display text-4xl font-normal tracking-wide sm:text-5xl">CONTACTO</h2>
        <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-muted-foreground sm:text-base">
          ¿Querés saber más sobre una prenda o hacernos una consulta? Escribinos, nos va a encantar leerte.
        </p>
        <div className="mx-auto mt-9 grid max-w-[680px] gap-3 sm:grid-cols-2">
          <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="group flex min-h-[76px] items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 text-left transition-[border-color,background-color,transform] duration-300 hover:-translate-y-0.5 hover:border-accent/50 hover:bg-sea focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transform-none motion-reduce:transition-none">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background text-accent"><Instagram className="h-5 w-5" strokeWidth={1.7} aria-hidden="true" /></span>
            <span className="min-w-0"><span className="block text-sm font-medium">Escribinos por Instagram</span><span className="mt-1 block text-xs text-muted-foreground">@eterea.newconcept</span></span>
          </a>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="group flex min-h-[76px] items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 text-left transition-[border-color,background-color,transform] duration-300 hover:-translate-y-0.5 hover:border-accent/50 hover:bg-sea focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transform-none motion-reduce:transition-none">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background text-accent"><WhatsAppIcon /></span>
            <span className="min-w-0"><span className="block text-sm font-medium">Escribinos por WhatsApp</span><span className="mt-1 block text-xs text-muted-foreground">223 449-5025</span></span>
          </a>
        </div>
      </div>
    </section>
  );
}
