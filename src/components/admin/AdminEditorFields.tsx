"use client";

import { useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Images,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { ImageSection } from "@/lib/media";
import { uploadImage } from "@/lib/media-client";

export function Field({
  label,
  value,
  onChange,
  multiline,
  type = "text",
}: {
  label: string;
  value: string | number | undefined;
  onChange: (value: string) => void;
  multiline?: boolean;
  type?: string;
}) {
  const className =
    "min-h-11 w-full border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground";
  return (
    <div>
      {multiline ? (
        <textarea
          rows={3}
          value={value ?? ""}
          placeholder={label}
          aria-label={label}
          onChange={(event) => onChange(event.target.value)}
          className={className}
        />
      ) : (
        <input
          type={type}
          value={value ?? ""}
          placeholder={label}
          aria-label={label}
          onChange={(event) => onChange(event.target.value)}
          className={className}
        />
      )}
    </div>
  );
}

export function ImageField({
  label,
  value,
  section,
  onChange,
  onUploaded,
}: {
  label: string;
  value: string;
  section: ImageSection;
  onChange: (value: string) => void;
  onUploaded: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="text-xs text-muted-foreground">
      {label}
      <div className="mt-1 flex items-center gap-3">
        {value ? (
          <img src={value} alt="" className="h-20 w-16 rounded-xl border object-cover" />
        ) : (
          <div className="h-20 w-16 rounded-xl border bg-muted" />
        )}
        <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-foreground hover:bg-secondary">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{" "}
          Cambiar foto
          <input
            type="file"
            accept="image/avif,image/gif,image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setBusy(true);
              try {
                const url = await uploadImage(file, section);
                onUploaded(url);
                onChange(url);
              } catch {
                toast.error("No se pudo subir la foto");
              }
              setBusy(false);
            }}
          />
        </label>
      </div>
    </div>
  );
}

export function ListControls({
  i,
  len,
  move,
  remove,
}: {
  i: number;
  len: number;
  move: (from: number, to: number) => void;
  remove?: (index: number) => void;
}) {
  const buttonClass =
    "grid h-10 w-10 place-items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-30 sm:h-11 sm:w-11";
  return (
    <div className="flex shrink-0 items-center gap-2 min-[900px]:border-l min-[900px]:border-border min-[900px]:pl-4">
      <button
        type="button"
        aria-label="Subir"
        disabled={i === 0}
        onClick={() => move(i, i - 1)}
        className={`${buttonClass} bg-secondary text-foreground hover:bg-primary/20`}
      >
        <ArrowUp className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Bajar"
        disabled={i === len - 1}
        onClick={() => move(i, i + 1)}
        className={`${buttonClass} bg-secondary text-foreground hover:bg-primary/20`}
      >
        <ArrowDown className="h-4 w-4" />
      </button>
      {remove && <button
        type="button"
        aria-label="Borrar"
        onClick={() => remove(i)}
        className={`${buttonClass} bg-red-500/15 text-red-300 hover:bg-red-500/25`}
      >
        <Trash2 className="h-4 w-4" />
      </button>}
    </div>
  );
}

export function useList<T>(value: T[], onChange: (value: T[]) => void) {
  return {
    set: (index: number, patch: Partial<T>) =>
      onChange(
        value.map((item, current) =>
          current === index
            ? typeof item === "object"
              ? { ...item, ...patch }
              : (patch as T)
            : item,
        ),
      ),
    move: (from: number, to: number) => {
      const next = [...value];
      const [item] = next.splice(from, 1);
      if (item !== undefined) next.splice(to, 0, item);
      onChange(next);
    },
    remove: (index: number) => onChange(value.filter((_, current) => current !== index)),
    add: (item: T) => onChange([...value, item]),
  };
}

export function CollapsibleCard({
  title,
  summary,
  preview,
  badge,
  children,
  right,
  className = "",
}: {
  title: string;
  summary?: string;
  preview?: string;
  badge?: string;
  children: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <Collapsible
      className={`admin-card-surface overflow-hidden rounded-[22px] border border-border ${className}`}
    >
      <div className="flex flex-col gap-3 p-3 min-[900px]:flex-row min-[900px]:items-center min-[900px]:gap-4 sm:p-5">
        <CollapsibleTrigger className="group flex min-h-12 min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-4">
          {preview !== undefined && (
            <>
              {preview ? (
                <img
                  src={preview}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-2xl object-cover sm:h-24 sm:w-24"
                />
              ) : (
                <span className="h-16 w-16 shrink-0 rounded-2xl bg-muted sm:h-24 sm:w-24" />
              )}
            </>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-base font-semibold sm:text-lg">{title}</span>
            {summary && (
              <span className="mt-1 block truncate text-xs text-muted-foreground sm:text-sm">
                {summary}
              </span>
            )}
            {badge && (
              <span className="mt-2 inline-flex max-w-full items-center gap-1.5 truncate rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary sm:text-xs">
                <Images className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {badge}
              </span>
            )}
          </span>
          <ChevronDown
            className="h-10 w-10 shrink-0 rounded-full bg-secondary p-2.5 text-foreground transition-transform group-data-[state=open]:rotate-180 sm:h-11 sm:w-11"
            aria-hidden="true"
          />
        </CollapsibleTrigger>
        {right}
      </div>
      <CollapsibleContent
        forceMount
        className="hidden border-t border-border data-[state=open]:block"
      >
        <div className="p-4 sm:p-6">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-5 flex min-h-[72px] items-center gap-3 rounded-[20px] border border-dashed border-primary/30 bg-primary/5 px-5 py-3 text-sm font-medium transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-[82px] sm:px-7 sm:text-base"
    >
      <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary sm:h-11 sm:w-11">
        <Plus className="h-5 w-5" />
      </span>{" "}
      {children}
    </button>
  );
}
