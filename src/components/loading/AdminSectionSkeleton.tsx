import { Skeleton } from "@/components/ui/skeleton";
import { AdminCatalogSkeleton } from "@/components/loading/AdminCatalogSkeleton";
import type { ContentKey } from "@/lib/content";

type AdminSection = Exclude<ContentKey, "contact">;

const sectionDetails: Record<AdminSection, { title: string; description: string }> = {
  promo: { title: "Promociones", description: "Mensajes que aparecen en la tienda." },
  hero: { title: "Banners", description: "Imágenes y textos destacados." },
  categories: { title: "Categorías", description: "Agrupá productos y definí los filtros del catálogo." },
  products: { title: "Productos", description: "Prendas, precios y categorías." },
  texts: { title: "Diseño del inicio", description: "Secciones, tarjetas destacadas, textos y fotos del home." },
  instagram: { title: "Redes y contacto", description: "Instagram y datos de contacto." },
};

function Card({ children }: { children: React.ReactNode }) {
  return <div className="admin-card-surface rounded-[22px] border border-border p-4 sm:p-5">{children}</div>;
}

function CardHeading({ image = false }: { image?: boolean }) {
  return (
    <div className="flex items-center gap-3 sm:gap-4">
      {image && <Skeleton className="h-16 w-16 shrink-0 rounded-2xl sm:h-24 sm:w-24" />}
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-5 w-36 max-w-full rounded-none" />
        <Skeleton className="h-4 w-52 max-w-full rounded-none" />
      </div>
      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
    </div>
  );
}

function SectionBody({ section }: { section: AdminSection }) {
  if (section === "promo") return (
    <div className="space-y-3" aria-hidden="true">
      <Skeleton className="mb-4 h-4 w-72 max-w-full rounded-none" />
      {Array.from({ length: 3 }, (_, index) => <Card key={index}><CardHeading /></Card>)}
      <Skeleton className="h-11 w-44 rounded-xl" />
    </div>
  );

  if (section === "hero") return (
    <div className="space-y-3 sm:space-y-4" aria-hidden="true">
      {Array.from({ length: 3 }, (_, index) => <Card key={index}><CardHeading image /></Card>)}
      <Skeleton className="h-11 w-40 rounded-xl" />
    </div>
  );

  if (section === "categories" || section === "products") return <AdminCatalogSkeleton section={section} />;

  if (section === "texts") return (
    <div className="space-y-3 sm:space-y-4" aria-hidden="true">
      <Card><CardHeading /></Card>
      <Card><CardHeading /></Card>
      <Card><CardHeading image /></Card>
      <Card><CardHeading /></Card>
    </div>
  );

  return (
    <div className="space-y-3 sm:space-y-5" aria-hidden="true">
      <Card><CardHeading /></Card>
      <Card><CardHeading /></Card>
      <Card><CardHeading /></Card>
      <Card><CardHeading image /></Card>
    </div>
  );
}

export function AdminSectionSkeleton({ section }: { section: AdminSection }) {
  const { title, description } = sectionDetails[section];
  const fillsPanel = section === "categories" || section === "products";

  return (
    <div
      className={fillsPanel
        ? "flex h-[calc(100dvh-68px-7rem-env(safe-area-inset-bottom))] min-h-0 w-full flex-col overflow-hidden sm:h-[calc(100dvh-74px-2.5rem)]"
        : "mx-auto w-full max-w-[1120px]"}
      role="status"
      aria-label={`Cargando ${title.toLocaleLowerCase("es-AR")}`}
    >
      <div className="sticky top-0 z-20 -mx-5 mb-7 shrink-0 bg-background/95 px-5 py-4 backdrop-blur-xl sm:-mx-7 sm:mb-8 sm:px-7 lg:-mx-10 lg:px-10 xl:-mx-12 xl:px-12">
        <h2 className="truncate font-display text-[28px] font-semibold leading-tight sm:text-[38px]">{title}</h2>
        <p className="mt-1 text-xs text-muted-foreground sm:mt-2 sm:text-base">{description}</p>
      </div>
      <SectionBody section={section} />
    </div>
  );
}
