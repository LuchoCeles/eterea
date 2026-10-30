"use client";

import { useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { CatalogProductCard } from "@/components/store/CatalogProductCard";
import { CatalogSearchPanel } from "@/components/store/CatalogSearchPanel";
import { useContent } from "@/components/providers/ContentProvider";
import { useCart } from "@/components/providers/CartProvider";
import { Button } from "@/components/ui/button";
import { hasRealDiscount, instagramProfileUrl } from "@/lib/storefront-rules";
import { catalogProducts, sortProductsByAvailability } from "@/lib/catalog-products";

const PRODUCTS_PER_PAGE = 12;

export function CatalogPage({ initialCategory = "" }: { initialCategory?: string }) {
  const { add } = useCart();
  const [category, setCategory] = useState(initialCategory);
  const [size, setSize] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");
  const [discountOnly, setDiscountOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const products = useContent("products");
  const storeCategories = useContent("categories");
  const contact = useContent("contact");
  const instagramUrl = instagramProfileUrl(contact.instagramUsername);

  const visibleProducts = catalogProducts(products, storeCategories);
  const categoryCounts = new Map<string, number>();
  visibleProducts.forEach((product) => {
    const id = product.categoryId ?? "";
    categoryCounts.set(id, (categoryCounts.get(id) ?? 0) + 1);
  });
  const categories = storeCategories.filter((item) => categoryCounts.has(item.id));
  const activeCategory = categories.find((item) => item.id === category || item.name === category)?.id ?? "";
  const categoryProducts = activeCategory
    ? visibleProducts.filter((product) => product.categoryId === activeCategory)
    : visibleProducts;
  const sizeCounts = new Map<string, number>();
  categoryProducts.forEach((product) => {
    for (const option of new Set(product.sizes ?? [])) {
      sizeCounts.set(option, (sizeCounts.get(option) ?? 0) + 1);
    }
  });
  const sizes = [...sizeCounts.keys()];
  const categoryOptions = [
    { label: "Todas", value: "", count: visibleProducts.length },
    ...categories.map((item) => ({ label: item.name, value: item.id, count: categoryCounts.get(item.id) ?? 0 })),
  ];
  const sizeOptions = [
    { label: "Todos", value: "", count: categoryProducts.length },
    ...sizes.map((label) => ({ label, value: label, count: sizeCounts.get(label) ?? 0 })),
  ];
  const normalizedSearch = search.trim().toLocaleLowerCase("es-AR");
  const filteredProducts = visibleProducts.filter((product) => {
    const matchesCategory = !activeCategory || product.categoryId === activeCategory;
    const matchesSize = !size || product.sizes?.includes(size) === true;
    const matchesSearch = !normalizedSearch || `${product.name} ${product.category}`.toLocaleLowerCase("es-AR").includes(normalizedSearch);
    return matchesCategory && matchesSize && matchesSearch && (!discountOnly || hasRealDiscount(product));
  });
  let sortedProducts = [...filteredProducts];
  if (sort === "price-asc") sortedProducts.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") sortedProducts.sort((a, b) => b.price - a.price);
  if (sort === "name") sortedProducts.sort((a, b) => a.name.localeCompare(b.name, "es-AR"));
  sortedProducts = sortProductsByAvailability(sortedProducts);
  const saleCount = visibleProducts.filter(hasRealDiscount).length;
  const pageCount = Math.ceil(sortedProducts.length / PRODUCTS_PER_PAGE);
  const visiblePage = Math.min(currentPage, Math.max(pageCount, 1));
  const pageProducts = sortedProducts.slice((visiblePage - 1) * PRODUCTS_PER_PAGE, visiblePage * PRODUCTS_PER_PAGE);
  const firstVisibleProduct = sortedProducts.length === 0 ? 0 : (visiblePage - 1) * PRODUCTS_PER_PAGE + 1;
  const lastVisibleProduct = Math.min(visiblePage * PRODUCTS_PER_PAGE, sortedProducts.length);
  const activeFilterCount = Number(Boolean(activeCategory)) + Number(Boolean(size)) + Number(discountOnly);

  function selectCategory(value: string) {
    setCategory(value);
    setSize("");
    setCurrentPage(1);
  }

  function selectSize(value: string) {
    setSize(value);
    setCurrentPage(1);
  }

  function clearFilters() {
    setCategory("");
    setSize("");
    setSearch("");
    setDiscountOnly(false);
    setSort("recent");
    setCurrentPage(1);
  }

  function clearPanelFilters() {
    setCategory("");
    setSize("");
    setDiscountOnly(false);
    setSort("recent");
    setCurrentPage(1);
  }

  return (
    <div>
      <main>
        <section className="border-b bg-sand/60">
          <div className="mx-auto max-w-[1600px] px-4 py-12 md:px-8 md:py-16">
            <a href="/" className="eyebrow text-muted-foreground hover:text-foreground">Inicio <span className="mx-2">/</span> Tienda</a>
            <div className="mt-8 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <span className="eyebrow text-muted-foreground">Etérea · New Concept</span>
                <h1 className="mt-3 font-display text-5xl font-normal leading-none md:text-7xl">Prendas para sentirte vos.</h1>
                <p className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground">Descubrí piezas frescas, naturales y con ese espíritu costero que nos inspira.</p>
              </div>
              <p className="text-sm text-muted-foreground">{filteredProducts.length} {filteredProducts.length === 1 ? "prenda" : "prendas"}</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 py-8 md:px-8 md:py-12">
            <div className="min-w-0">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex h-11 items-center gap-3 border bg-background px-3 sm:max-w-sm sm:flex-1">
                  <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <input value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} placeholder="Buscar prendas…" aria-label="Buscar prendas" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
                </label>
                <CatalogSearchPanel
                  categoryOptions={categoryOptions}
                  sizeOptions={sizeOptions}
                  activeCategory={activeCategory}
                  activeSize={size}
                  onCategoryChange={selectCategory}
                  onSizeChange={selectSize}
                  discountOnly={discountOnly}
                  onDiscountChange={(value) => { setDiscountOnly(value); setCurrentPage(1); }}
                  showDiscount={saleCount > 0}
                  discountCount={saleCount}
                  sort={sort}
                  onSortChange={(value) => { setSort(value); setCurrentPage(1); }}
                  resultCount={filteredProducts.length}
                  activeFilterCount={activeFilterCount}
                  onClear={clearPanelFilters}
                />
              </div>
              {sortedProducts.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {pageProducts.map((product) => (
                      <CatalogProductCard key={`${product.id}-${product.name}`} product={product} onAdd={add} />
                    ))}
                  </div>
                  <div className="mt-10 flex flex-col items-center gap-4 border-t pt-6 sm:flex-row sm:justify-between">
                    <p className="text-xs text-muted-foreground">Mostrando {firstVisibleProduct}–{lastVisibleProduct} de {sortedProducts.length} prendas</p>
                    {pageCount > 1 && (
                      <nav className="flex items-center gap-1" aria-label="Paginación de productos">
                        <button
                          type="button"
                          onClick={() => setCurrentPage(visiblePage - 1)}
                          disabled={visiblePage === 1}
                          aria-label="Página anterior"
                          className="flex h-10 w-10 items-center justify-center border text-muted-foreground transition-colors hover:bg-card hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
                          <button
                            key={page}
                            type="button"
                            onClick={() => setCurrentPage(page)}
                            aria-label={`Página ${page}`}
                            aria-current={visiblePage === page ? "page" : undefined}
                            className={`h-10 min-w-10 border px-3 text-sm transition-colors ${visiblePage === page ? "border-primary bg-primary text-primary-foreground" : "hover:bg-card"}`}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(visiblePage + 1)}
                          disabled={visiblePage === pageCount}
                          aria-label="Página siguiente"
                          className="flex h-10 w-10 items-center justify-center border text-muted-foreground transition-colors hover:bg-card hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </nav>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex min-h-72 flex-col items-center justify-center border border-dashed px-6 text-center">
                  <span className="eyebrow text-muted-foreground">Sin resultados</span>
                  <p className="mt-3 font-display text-3xl">No encontramos esa prenda.</p>
                  <p className="mt-2 text-sm text-muted-foreground">Probá con otra búsqueda o cambiá los filtros.</p>
                  <Button variant="outline" onClick={clearFilters} className="mt-5 rounded-none">Limpiar filtros</Button>
                </div>
              )}
            </div>
        </section>
      </main>

      <footer className="border-t bg-background">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between md:px-8">
          <a href="/" className="font-display text-2xl">Etérea</a>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground">
            <a href="/" className="hover:text-foreground">Inicio</a>
            {instagramUrl && <a href={instagramUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">Escribinos <ArrowUpRight className="h-3.5 w-3.5" /></a>}
            <a href="/admin" className="hover:text-foreground">Administración</a>
          </div>
        </div>
        <div className="border-t px-4 py-4 text-center text-xs text-muted-foreground">© 2026 Etérea New Concept</div>
      </footer>
    </div>
  );
}
