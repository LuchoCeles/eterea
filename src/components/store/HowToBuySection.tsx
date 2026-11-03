export function HowToBuySection() {
  return (
    <section id="como-comprar" aria-labelledby="how-to-buy-title" className="border-t border-foreground/10 bg-pearl px-4 py-16 sm:px-6 md:py-24">
      <div className="mx-auto max-w-[1100px]">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow text-accent">Tu compra, paso a paso</p>
          <h2 id="how-to-buy-title" className="mt-3 font-display text-4xl font-normal tracking-tight sm:text-5xl md:text-6xl">
            ¿Cómo comprar?
          </h2>
          <div className="mx-auto mt-7 h-px w-16 bg-accent/60" aria-hidden="true" />
        </div>

        <ol className="mt-12 grid gap-4 md:mt-16 md:grid-cols-2 md:gap-6">
          <li className="flex flex-col rounded-[1.75rem] border border-foreground/10 bg-background p-7 sm:p-9">
            <span className="font-display text-4xl leading-none text-accent/70" aria-hidden="true">01</span>
            <h3 className="mt-8 font-display text-2xl font-normal sm:text-3xl">Elegí tus favoritas</h3>
            <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground sm:text-base">
              Elegí tus prendas favoritas y agregalas al carrito.
            </p>
          </li>
          <li className="flex flex-col rounded-[1.75rem] border border-foreground/10 bg-background p-7 sm:p-9">
            <span className="font-display text-4xl leading-none text-accent/70" aria-hidden="true">02</span>
            <h3 className="mt-8 font-display text-2xl font-normal sm:text-3xl">Coordinamos por WhatsApp</h3>
            <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground sm:text-base">
              Una vez que finalices tu compra, serás redirigida a nuestro WhatsApp, donde coordinaremos la forma de pago y la entrega de tu pedido.
            </p>
          </li>
        </ol>

        <div className="mt-5 rounded-[1.75rem] border border-accent/20 bg-sand/50 px-7 py-6 sm:mt-6 sm:px-9 sm:py-7">
          <p className="text-sm leading-7 text-foreground sm:text-base">
            <strong className="font-semibold">Importante:</strong> La compra no quedará confirmada hasta que el pedido haya sido abonado en su totalidad.
          </p>
        </div>
      </div>
    </section>
  );
}
