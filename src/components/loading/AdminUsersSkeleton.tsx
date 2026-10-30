import { Skeleton } from "@/components/ui/skeleton";

export function AdminUsersSkeleton() {
  return (
    <div className="mx-auto max-w-[1120px] pb-8" role="status" aria-label="Cargando usuarios">
      <div className="sticky top-0 z-20 -mx-5 mb-7 bg-background/95 px-5 py-5 backdrop-blur-xl sm:-mx-7 sm:px-7 lg:-mx-10 lg:px-10 xl:-mx-12 xl:px-12">
        <h2 className="font-display text-[28px] font-semibold leading-tight sm:text-[38px]">Cuenta</h2>
        <p className="mt-1 text-xs text-muted-foreground sm:text-base">Cargando datos de la cuenta.</p>
      </div>

      <div aria-hidden="true">
        <div className="admin-card-surface rounded-[22px] border border-border p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <Skeleton className="h-5 w-36 rounded-none" />
              <Skeleton className="h-4 w-64 max-w-full rounded-none" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24 rounded-lg" />
              <Skeleton className="h-10 w-24 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
