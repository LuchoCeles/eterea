import { Skeleton } from "@/components/ui/skeleton";

function StoreHeaderSkeleton() {
  return (
    <div className="sticky top-0 z-40">
      <div className="h-10 border-b bg-primary/10" aria-hidden="true" />
      <header className="border-b bg-background">
        <div className="mx-auto grid h-24 max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center px-4 md:px-8">
          <Skeleton className="h-11 w-11 rounded-full" />
          <Skeleton className="h-[72px] w-36 rounded-none md:h-20 md:w-44" />
          <div className="flex items-center justify-end gap-3">
            <Skeleton className="hidden h-4 w-24 rounded-none sm:block" />
            <Skeleton className="h-11 w-11 rounded-full" />
          </div>
        </div>
      </header>
    </div>
  );
}

function ProductCardSkeleton({ carousel = false }: { carousel?: boolean }) {
  return (
    <article className={carousel ? "w-[70%] shrink-0 sm:w-[42%] lg:w-[23.5%]" : "min-w-0"}>
      <Skeleton className="aspect-[4/5] w-full rounded-none" />
      <div
        className={
          carousel ? "mt-3 flex items-start justify-between gap-2" : "border-b px-1 pb-4 pt-4"
        }
      >
        <div className="min-w-0 flex-1">
          <Skeleton className="h-3 w-16 rounded-none" />
          <Skeleton className="mt-2 h-4 w-3/4 rounded-none" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16 rounded-none" />
          {!carousel && <Skeleton className="h-3 w-12 rounded-none" />}
        </div>
      </div>
      {!carousel && (
        <div className="mt-3 space-y-2 border-t border-dashed pt-3">
          <Skeleton className="h-3 w-32 rounded-none" />
          <Skeleton className="h-3 w-full rounded-none" />
          <Skeleton className="h-3 w-4/5 rounded-none" />
        </div>
      )}
    </article>
  );
}

function ProductCarouselSkeleton({ titleWidth = "w-64" }: { titleWidth?: string }) {
  return (
    <section className="mx-auto max-w-[1600px] px-4 py-20 md:px-8" aria-hidden="true">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-3 w-28 rounded-none" />
          <Skeleton className={`mt-3 h-9 max-w-full rounded-none md:h-12 ${titleWidth}`} />
        </div>
        <div className="flex shrink-0 gap-2">
          <Skeleton className="h-10 w-10 rounded-none" />
          <Skeleton className="h-10 w-10 rounded-none" />
        </div>
      </div>
      <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-hidden px-4 md:mx-0 md:px-0">
        {Array.from({ length: 4 }, (_, index) => (
          <ProductCardSkeleton key={index} carousel />
        ))}
      </div>
    </section>
  );
}

function StoreFooterSkeleton({ catalog = false }: { catalog?: boolean }) {
  if (catalog) {
    return (
      <footer className="border-t bg-background" aria-hidden="true">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between md:px-8">
          <Skeleton className="h-8 w-28 rounded-none" />
          <div className="flex gap-6">
            <Skeleton className="h-4 w-12 rounded-none" />
            <Skeleton className="h-4 w-20 rounded-none" />
            <Skeleton className="h-4 w-28 rounded-none" />
          </div>
        </div>
        <div className="border-t px-4 py-4">
          <Skeleton className="mx-auto h-3 w-36 rounded-none" />
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-background" aria-hidden="true">
      <div className="mx-auto grid max-w-[1600px] gap-10 px-4 py-14 sm:grid-cols-2 md:grid-cols-4 md:px-8">
        <Skeleton className="h-24 w-48 rounded-none" />
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index}>
            <Skeleton className="h-3 w-20 rounded-none" />
            <div className="mt-5 space-y-3">
              <Skeleton className="h-4 w-28 rounded-none" />
              <Skeleton className="h-4 w-32 rounded-none" />
              <Skeleton className="h-4 w-24 rounded-none" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-3 border-t px-4 py-5 md:px-8">
        <Skeleton className="h-3 w-44 rounded-none" />
        <Skeleton className="h-3 w-28 rounded-none" />
      </div>
    </footer>
  );
}

export function HomeSkeleton() {
  return (
    <div className="min-h-screen" aria-busy="true" aria-label="Cargando inicio">
      <StoreHeaderSkeleton />
      <main aria-hidden="true">
        <section className="relative h-[72svh] min-h-[510px] max-h-[820px] w-full overflow-hidden bg-pearl">
          <Skeleton className="absolute inset-0 rounded-none" />
          <div className="absolute bottom-16 left-0 flex w-full max-w-2xl flex-col gap-4 px-6 md:bottom-24 md:w-[48%] md:px-16">
            <Skeleton className="h-3 w-44 rounded-none bg-background/30" />
            <Skeleton className="h-16 w-4/5 rounded-none bg-background/30 md:h-24" />
            <Skeleton className="h-4 w-64 max-w-full rounded-none bg-background/30" />
            <Skeleton className="mt-3 h-12 w-44 rounded-none bg-background/30" />
          </div>
          <div className="absolute bottom-6 left-6 right-6 flex gap-2 md:left-16 md:right-16">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-[2px] flex-1 rounded-none bg-background/40" />
            ))}
          </div>
        </section>

        <section className="border-b">
          <div className="mx-auto grid max-w-[1600px] grid-cols-1 divide-y px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 md:px-8">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex items-center gap-4 py-5 sm:justify-center">
                <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-36 rounded-none" />
                  <Skeleton className="h-3 w-44 rounded-none" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 pt-16 md:px-8">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="aspect-[3/4] w-full rounded-none" />
            ))}
          </div>
        </section>

        <ProductCarouselSkeleton titleWidth="w-72" />

        <section
          className="mx-auto grid max-w-[1600px] items-center gap-10 px-4 py-20 md:grid-cols-12 md:px-8"
          aria-hidden="true"
        >
          <Skeleton className="aspect-[4/5] w-full rounded-none md:col-span-5" />
          <div className="md:col-span-6 md:col-start-7">
            <Skeleton className="h-3 w-28 rounded-none" />
            <Skeleton className="mt-4 h-12 w-full max-w-xl rounded-none md:h-16" />
            <div className="mt-6 max-w-lg space-y-2">
              <Skeleton className="h-4 w-full rounded-none" />
              <Skeleton className="h-4 w-11/12 rounded-none" />
              <Skeleton className="h-4 w-4/5 rounded-none" />
            </div>
            <Skeleton className="mt-8 h-4 w-52 rounded-none" />
            <Skeleton className="mt-8 h-40 w-40 rounded-full" />
          </div>
        </section>

        <section className="border-t bg-sea py-14 md:py-20">
          <div className="mx-auto max-w-[1600px] px-4 md:px-8">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="flex items-center gap-5">
                <Skeleton className="hidden h-20 w-20 rounded-full sm:block" />
                <div>
                  <Skeleton className="h-3 w-36 rounded-none" />
                  <Skeleton className="mt-3 h-10 w-72 max-w-full rounded-none md:h-12" />
                  <Skeleton className="mt-3 h-4 w-40 rounded-none" />
                </div>
              </div>
              <Skeleton className="h-12 w-60 max-w-full rounded-none" />
            </div>
          </div>
        </section>

        <section className="bg-primary text-primary-foreground" aria-hidden="true">
          <div className="mx-auto grid max-w-[1600px] gap-8 px-4 py-16 md:grid-cols-2 md:items-end md:px-8">
            <Skeleton className="h-12 w-64 max-w-full rounded-none bg-primary-foreground/20 md:h-14" />
            <div>
              <Skeleton className="h-4 w-full max-w-md rounded-none bg-primary-foreground/20" />
              <Skeleton className="mt-6 h-12 w-48 rounded-none bg-primary-foreground/20" />
            </div>
          </div>
        </section>
      </main>
      <StoreFooterSkeleton />
    </div>
  );
}

export function CatalogSkeleton() {
  return (
    <div className="min-h-screen" aria-busy="true" aria-label="Cargando prendas">
      <StoreHeaderSkeleton />
      <main>
        <section className="border-b bg-sand/60" aria-hidden="true">
          <div className="mx-auto max-w-[1600px] px-4 py-12 md:px-8 md:py-16">
            <Skeleton className="h-3 w-32 rounded-none" />
            <div className="mt-8 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <Skeleton className="h-3 w-44 rounded-none" />
                <Skeleton className="mt-3 h-14 w-full max-w-3xl rounded-none md:h-20" />
                <Skeleton className="mt-5 h-4 w-full max-w-xl rounded-none" />
              </div>
              <Skeleton className="h-4 w-20 rounded-none" />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 py-8 md:px-8 md:py-12" aria-hidden="true">
          <div className="grid gap-8 lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-10">
            <aside className="min-w-0">
              <div className="border-y py-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28 rounded-none" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </div>
                <div className="mt-4 space-y-4 pb-1">
                  {Array.from({ length: 5 }, (_, index) => (
                    <div key={index} className="flex justify-between">
                      <Skeleton className="h-4 w-24 rounded-none" />
                      <Skeleton className="h-3 w-5 rounded-none" />
                    </div>
                  ))}
                </div>
              </div>
              <Skeleton className="mt-5 hidden h-10 w-full rounded-none lg:block" />
            </aside>

            <div className="min-w-0">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Skeleton className="h-11 w-full rounded-none sm:max-w-sm" />
                <Skeleton className="h-11 w-36 rounded-none self-end" />
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10 md:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 12 }, (_, index) => (
                  <ProductCardSkeleton key={index} />
                ))}
              </div>
              <div className="mt-10 flex flex-col items-center gap-4 border-t pt-6 sm:flex-row sm:justify-between">
                <Skeleton className="h-4 w-48 rounded-none" />
                <div className="flex gap-1">
                  {Array.from({ length: 5 }, (_, index) => (
                    <Skeleton key={index} className="h-10 w-10 rounded-none" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <StoreFooterSkeleton catalog />
    </div>
  );
}

export function AuthSkeleton() {
  return (
    <main
      className="grid min-h-screen place-items-center bg-background px-4"
      aria-busy="true"
      aria-label="Cargando acceso"
    >
      <div className="w-full max-w-sm space-y-5 border bg-card p-8" aria-hidden="true">
        <div>
          <Skeleton className="mx-auto mb-6 h-24 w-48 rounded-none" />
          <Skeleton className="h-3 w-24 rounded-none" />
          <Skeleton className="mt-2 h-10 w-44 rounded-none" />
          <Skeleton className="mt-3 h-10 w-full rounded-none" />
        </div>
        <Skeleton className="h-11 w-full rounded-none" />
        <Skeleton className="h-11 w-full rounded-none" />
        <Skeleton className="h-4 w-48 max-w-full rounded-none" />
      </div>
    </main>
  );
}
