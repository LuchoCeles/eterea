import { Skeleton } from "@/components/ui/skeleton";

export function AdminShippingSkeleton() {
  return <div className="mx-auto max-w-[900px] space-y-5 py-6" role="status" aria-label="Cargando configuración de envíos">
    <Skeleton className="h-11 w-56 max-w-full" />
    <Skeleton className="h-5 w-96 max-w-full" />
    {[0, 1, 2].map((item) => <div key={item} className="admin-card-surface space-y-4 rounded-[22px] border p-6">
      <Skeleton className="h-6 w-44" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>)}
  </div>;
}
