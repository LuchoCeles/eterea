"use client";

import { usePathname } from "next/navigation";
import { AdminSectionSkeleton } from "@/components/loading/AdminSectionSkeleton";
import { AdminUsersSkeleton } from "@/components/loading/AdminUsersSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminContentSkeleton() {
  const pathname = usePathname();
  if (pathname === "/admin/productos") return <AdminSectionSkeleton section="products" />;
  if (pathname === "/admin/categorias") return <AdminSectionSkeleton section="categories" />;
  if (pathname === "/admin/usuarios") return <AdminUsersSkeleton />;

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
