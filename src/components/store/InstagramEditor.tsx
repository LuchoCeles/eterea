"use client";

import { Trash2, Upload, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AddButton, CollapsibleCard } from "@/components/admin/AdminEditorFields";
import type { InstagramPost } from "@/lib/content";
import { uploadImage } from "@/lib/media-client";
import { instagramPermalink } from "@/lib/storefront-rules";

export function InstagramEditor({
  value,
  onChange,
  onUploaded,
}: {
  value: InstagramPost[];
  onChange: (value: InstagramPost[]) => void;
  onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState<string | null>(null);
  const update = (id: string, patch: Partial<InstagramPost>) =>
    onChange(value.map((post) => (post.id === id ? { ...post, ...patch } : post)));
  return (
    <div className="space-y-3 sm:space-y-5">
      <p className="text-sm leading-6 text-muted-foreground">
        Cuando Instagram está conectado, la tienda muestra automáticamente sus últimas
        publicaciones. Estos enlaces se usan como alternativa si la conexión falla. Pegá
        publicaciones o reels reales de @eterea.newconcept; la portada es opcional.
      </p>
      {value.map((post) => (
        <CollapsibleCard
          key={post.id}
          title={post.kind === "reel" ? "Reel" : "Publicación"}
          summary={post.title || post.url || "Enlace y portada"}
          preview={post.image}
          right={
            <Button
              variant="ghost"
              size="icon"
              aria-label="Borrar publicación"
              onClick={() => onChange(value.filter((item) => item.id !== post.id))}
            >
              <Trash2 />
            </Button>
          }
        >
          <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
            <div>
              {post.image && (
                <img
                  src={post.image}
                  alt="Portada seleccionada"
                  className="mb-3 h-32 w-24 object-cover"
                />
              )}
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs hover:bg-secondary">
                {uploading === post.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}{" "}
                Subir portada
                <input
                  type="file"
                  accept="image/avif,image/gif,image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    setUploading(post.id);
                    try {
                      const url = await uploadImage(file, "instagram");
                      onUploaded(url);
                      update(post.id, { image: url });
                    } catch {
                      toast.error("No se pudo subir la portada");
                    }
                    setUploading(null);
                  }}
                />
              </label>
            </div>
            <div className="space-y-3">
              <label className="block text-xs text-muted-foreground">
                Enlace de Instagram
                <input
                  value={post.url}
                  onChange={(event) => update(post.id, { url: event.target.value })}
                  placeholder="https://www.instagram.com/reel/…/"
                  className="mt-1 w-full border bg-background px-3 py-2 text-sm"
                />
              </label>
              {post.url && !instagramPermalink(post.url) && (
                <p className="text-xs text-destructive">
                  Usá un enlace de una publicación o reel de Instagram.
                </p>
              )}
              <label className="block text-xs text-muted-foreground">
                Título
                <input
                  value={post.title}
                  onChange={(event) => update(post.id, { title: event.target.value })}
                  className="mt-1 w-full border bg-background px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-xs text-muted-foreground">
                Tipo
                <select
                  value={post.kind}
                  onChange={(event) =>
                    update(post.id, { kind: event.target.value === "reel" ? "reel" : "post" })
                  }
                  className="mt-1 w-full border bg-background px-3 py-2 text-sm"
                >
                  <option value="post">Publicación</option>
                  <option value="reel">Reel</option>
                </select>
              </label>
            </div>
          </div>
        </CollapsibleCard>
      ))}
      <AddButton
        onClick={() =>
          onChange([
            ...value,
            { id: crypto.randomUUID(), url: "", image: "", title: "", kind: "post" },
          ])
        }
      >
        Agregar publicación o reel
      </AddButton>
    </div>
  );
}
