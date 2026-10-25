import Link from "next/link";
import { ArrowUpRight, LogOut, Moon, Sun } from "lucide-react";

export function AdminHeader({
  email,
  onSignOut,
  theme,
  onToggleTheme,
}: {
  email: string;
  onSignOut: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}) {
  return (
    <header className="z-20 flex h-[68px] shrink-0 items-center justify-between gap-4 border-b border-border px-5 sm:h-[74px] sm:px-7 lg:px-9">
      <div className="flex min-w-0 items-baseline gap-3 sm:gap-5">
        <Link
          href="/"
          className="shrink-0 font-display text-[29px] leading-none tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-[33px]"
        >
          Etérea
        </Link>
        <span className="hidden truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground md:block sm:text-[11px]">
          Administración
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        <span
          className="mr-2 hidden max-w-48 truncate text-xs text-muted-foreground lg:block"
          title={email}
        >
          {email}
        </span>
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
          title={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
          className="grid h-10 w-10 place-items-center rounded-full text-foreground/85 transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <Link
          href="/"
          aria-label="Ver tienda"
          className="inline-flex h-10 items-center gap-2 rounded-full px-2 text-sm font-medium transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3"
        >
          <span className="hidden sm:inline">Ver tienda</span>
          <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
        </Link>
        <button
          type="button"
          onClick={onSignOut}
          aria-label="Cerrar sesión"
          className="inline-flex h-10 items-center gap-2 rounded-full px-2 text-sm font-medium text-foreground/85 transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3"
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}
