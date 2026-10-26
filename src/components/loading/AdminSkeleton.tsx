import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Skeleton } from "@/components/ui/skeleton";

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
    <div className="admin-theme flex h-dvh min-h-[480px] flex-col bg-background text-foreground">
      <div className="admin-shell relative flex h-full w-full flex-col overflow-hidden">
        <header className="z-20 flex h-[68px] shrink-0 items-center gap-3 border-b border-border px-5 sm:h-[74px] sm:gap-5 sm:px-7 lg:px-9">
          <span className="font-display text-[29px] leading-none tracking-tight sm:text-[33px]">Etérea</span>
          <span className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground md:block sm:text-[11px]">
            Administración
          </span>
        </header>
        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          <main
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:px-7 sm:pb-10 lg:px-10 xl:px-12"
            aria-busy="true"
          >
            <AdminContentSkeleton />
          </main>
          <AdminSidebar owner={false} />
        </div>
      </div>
    </div>
  );
}
