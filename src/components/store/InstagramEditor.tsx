"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddButton, CollapsibleCard } from "@/components/admin/AdminEditorFields";
import { SharedImageField } from "@/components/admin/SharedImageField";
import { useContent } from "@/components/providers/ContentProvider";
import type { InstagramPost } from "@/lib/content";
import { resolveImageSource } from "@/lib/image-source";
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
  const products = useContent("products");
  const update = (id: string, patch: Partial<InstagramPost>) =>
    onChange(value.map((post) => (post.id === id ? { ...post, ...patch } : post)));
  return (
    <div className="space-y-3 sm:space-y-5">
      <p className="text-sm leading-6 text-muted-foreground">
        Si la cuenta de Instagram de la marca está conectada, el Home muestra sus últimas publicaciones automáticamente.
        Esta lista manual se usa mientras no haya conexión. Pegá enlaces de publicaciones o reels
        reales de la marca y cargá una portada para cada uno. Al tocar una imagen, se abre
        la publicación en Instagram.
      </p>
      {value.map((post) => (
        <CollapsibleCard
          key={post.id}
          title={post.kind === "reel" ? "Reel" : "Publicación"}
          summary={post.title || post.url || "Enlace y portada"}
          preview={post.image || post.productId ? resolveImageSource(post, products) : ""}
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
            <SharedImageField label="Portada" image={post.image} productId={post.productId} section="instagram" onUploaded={onUploaded} onChange={({ image, productId }) => update(post.id, { image, productId })} />
            <div className="space-y-3">
              <div>
                <input
                  value={post.url}
                  onChange={(event) => update(post.id, { url: event.target.value })}
                  placeholder="https://www.instagram.com/reel/…/"
                  aria-label="Enlace de Instagram"
                  className="w-full border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
                />
              </div>
              {post.url && !instagramPermalink(post.url) && (
                <p className="text-xs text-destructive">
                  Usá un enlace de una publicación o reel de Instagram.
                </p>
              )}
              <div>
                <input
                  value={post.title}
                  onChange={(event) => update(post.id, { title: event.target.value })}
                  placeholder="Título"
                  aria-label="Título"
                  className="w-full border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
                />
              </div>
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
