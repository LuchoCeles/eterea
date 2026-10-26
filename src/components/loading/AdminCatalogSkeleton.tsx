import { Skeleton } from "@/components/ui/skeleton";

function CatalogToolbarSkeleton({ products }: { products: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Skeleton className={products ? "h-4 w-[520px] max-w-full rounded-none" : "h-4 w-[680px] max-w-full rounded-none"} />
      <Skeleton className={products ? "h-11 w-44 rounded-xl" : "h-11 w-40 rounded-xl"} />
    </div>
  );
}

function ProductTableSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border bg-card/30">
      <div className="hidden min-h-0 flex-1 flex-col overflow-hidden lg:flex">
        <div className="flex min-w-[940px] flex-1 flex-col">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1.2fr_0.8fr] gap-4 border-b bg-secondary/40 px-4 py-3">
            {["w-16", "w-20", "w-12", "w-14", "w-12", "w-24", "w-14"].map((width, index) => (
              <Skeleton key={index} className={`h-3 rounded-none ${width}`} />
            ))}
          </div>
          {Array.from({ length: 10 }, (_, index) => (
            <div key={index} className="grid min-h-20 flex-1 grid-cols-[2fr_1fr_1fr_1fr_1fr_1.2fr_0.8fr] items-center gap-4 border-b px-4 py-3 last:border-b-0">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
                <Skeleton className="h-4 w-28 max-w-full rounded-none" />
              </div>
              <Skeleton className="h-4 w-20 max-w-full rounded-none" />
              <Skeleton className="h-4 w-16 max-w-full rounded-none" />
              <Skeleton className="h-4 w-14 max-w-full rounded-none" />
              <Skeleton className="h-4 w-20 max-w-full rounded-none" />
              <Skeleton className="h-5 w-9 rounded-full" />
              <div className="flex justify-end gap-1">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-10 w-10 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col divide-y overflow-hidden lg:hidden">
        {Array.from({ length: 10 }, (_, index) => (
          <div key={index} className="flex min-h-20 flex-1 items-center gap-3 p-3 sm:p-4">
            <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-36 max-w-full rounded-none" />
              <Skeleton className="h-3 w-28 max-w-full rounded-none" />
            </div>
            <Skeleton className="h-5 w-9 shrink-0 rounded-full" />
            <div className="flex shrink-0 gap-1">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryTableSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border bg-card/30">
      <div className="hidden min-h-0 flex-1 flex-col overflow-hidden lg:flex">
        <div className="grid grid-cols-3 border-b bg-secondary/40 px-4 py-3">
          <Skeleton className="h-3 w-14 rounded-none" />
          <Skeleton className="h-3 w-36 rounded-none" />
          <Skeleton className="h-3 w-28 rounded-none" />
        </div>
        {Array.from({ length: 12 }, (_, index) => (
          <div key={index} className="grid min-h-[68px] flex-1 grid-cols-3 items-center border-b px-4 py-3 last:border-b-0">
            <Skeleton className="h-11 w-full max-w-[300px] rounded-lg" />
            <Skeleton className="h-4 w-24 rounded-none" />
            <Skeleton className="h-5 w-9 rounded-full" />
          </div>
        ))}
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3 lg:hidden">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="min-h-[160px] flex-1 space-y-3 rounded-xl border bg-background p-4">
            <Skeleton className="h-3 w-14 rounded-none" />
            <Skeleton className="h-11 w-full rounded-lg" />
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-28 rounded-none" />
              <Skeleton className="h-5 w-9 rounded-full" />
            </div>
            <Skeleton className="h-3 w-32 rounded-none" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminCatalogSkeleton({ section }: { section: "products" | "categories" }) {
  const products = section === "products";
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-hidden" aria-hidden="true">
      <CatalogToolbarSkeleton products={products} />
      {products && <Skeleton className="h-11 w-full max-w-sm rounded-md" />}
      {products ? <ProductTableSkeleton /> : <CategoryTableSkeleton />}
      {products && <Skeleton className="mx-auto h-3 w-52 rounded-none" />}
    </div>
  );
}
