import { Skeleton } from "@/components/ui/skeleton";

function AdminNavSkeleton() {
  return (
    <aside
      className="z-30 shrink-0 border-t border-border bg-background/95 px-2 pb-[env(safe-area-inset-bottom)] sm:order-first sm:w-[205px] sm:border-r sm:border-t-0 sm:bg-card/25 sm:px-3 sm:py-6 lg:w-[210px]"
      aria-hidden="true"
    >
      <Skeleton className="mb-4 ml-3 hidden h-3 w-20 rounded-none sm:block" />
      <nav className="mx-auto grid max-w-[780px] grid-cols-6 gap-1 py-2 sm:flex sm:flex-col sm:gap-2 sm:py-0">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="flex min-h-[66px] flex-col items-center justify-center gap-2 rounded-2xl px-1 sm:min-h-[52px] sm:flex-row sm:justify-start sm:gap-3 sm:rounded-xl sm:px-3"
          >
            <Skeleton className="h-6 w-6 shrink-0 rounded-full" />
            <Skeleton className="h-3 w-12 rounded-none sm:hidden" />
            <Skeleton className="hidden h-4 w-28 rounded-none sm:block" />
          </div>
        ))}
      </nav>
    </aside>
  );
}

export function AdminContentSkeleton() {
  return (
    <div className="mx-auto max-w-[1120px]" role="status" aria-label="Cargando contenido del panel">
      <div className="sticky top-0 z-20 -mx-5 mb-7 bg-background/95 px-5 py-4 backdrop-blur-xl sm:-mx-7 sm:mb-8 sm:px-7 lg:-mx-10 lg:px-10 xl:-mx-12 xl:px-12">
        <Skeleton className="h-9 w-56 max-w-full rounded-none sm:h-12" />
        <Skeleton className="mt-2 h-4 w-72 max-w-full rounded-none" />
      </div>
      <div className="space-y-3 sm:space-y-4" aria-hidden="true">
        {Array.from({ length: 3 }, (_, index) => (
          <section
            key={index}
            className="admin-card-surface overflow-hidden rounded-[22px] border border-border p-3 sm:p-5"
          >
            <div className="flex flex-col gap-3 min-[900px]:flex-row min-[900px]:items-center min-[900px]:gap-4">
              <div className="flex min-h-12 min-w-0 flex-1 items-center gap-3 sm:gap-4">
                <Skeleton className="h-16 w-16 shrink-0 rounded-2xl sm:h-24 sm:w-24" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-5 w-32 max-w-full rounded-none" />
                  <Skeleton className="h-4 w-48 max-w-full rounded-none" />
                  <Skeleton className="h-6 w-28 rounded-full" />
                </div>
                <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
              </div>
              <div className="flex shrink-0 items-center justify-end gap-2 min-[900px]:border-l min-[900px]:border-border min-[900px]:pl-4">
                <Skeleton className="h-10 w-10 rounded-full sm:h-11 sm:w-11" />
                <Skeleton className="h-10 w-10 rounded-full sm:h-11 sm:w-11" />
                <Skeleton className="h-10 w-10 rounded-full sm:h-11 sm:w-11" />
              </div>
            </div>
          </section>
        ))}
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function AdminSkeleton() {
  return (
    <div
      data-theme="dark"
      className="admin-theme flex h-dvh min-h-[480px] flex-col bg-background text-foreground"
      aria-busy="true"
      aria-label="Cargando panel de administración"
    >
      <div className="admin-shell flex h-full w-full flex-col overflow-hidden">
        <header
          className="z-20 flex h-[68px] shrink-0 items-center justify-between gap-4 border-b border-border px-5 sm:h-[74px] sm:px-7 lg:px-9"
          aria-hidden="true"
        >
          <div className="flex items-baseline gap-3 sm:gap-5">
            <Skeleton className="h-8 w-24 rounded-none" />
            <Skeleton className="hidden h-3 w-28 rounded-none md:block" />
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Skeleton className="hidden h-4 w-36 rounded-none lg:block" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-24 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </header>
        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-10 sm:px-7 lg:px-10 xl:px-12">
            <AdminContentSkeleton />
          </main>
          <AdminNavSkeleton />
        </div>
      </div>
    </div>
  );
}
