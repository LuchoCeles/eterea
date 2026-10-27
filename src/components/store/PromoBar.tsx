"use client";

import { Waves } from "lucide-react";
import { defaults } from "@/lib/content";
import { useContent } from "@/components/providers/ContentProvider";
import { visibleAnnouncements } from "@/lib/storefront-rules";

export function PromoBar() {
  const saved = useContent("promo");
  const { offers } = useContent("texts");
  const filtered = visibleAnnouncements(saved, offers.enabled);
  const messages = filtered.length ? filtered : visibleAnnouncements(defaults.promo, offers.enabled);
  const copies = messages.length ? Math.max(2, Math.ceil(12 / messages.length)) : 0;
  const tickerMessages = Array.from({ length: copies }, () => messages).flat();
  const duration = Math.max(60, tickerMessages.length * 7);

  if (!messages.length) return null;
  return (
    <div className="overflow-hidden bg-black text-white">
      <p className="sr-only">Anuncios: {messages.join(". ")}</p>
      <div className="animate-promo-marquee flex w-max whitespace-nowrap" style={{ animationDuration: `${duration}s` }} aria-hidden="true">
        {Array.from({ length: 2 }).map((_, copy) => (
          <div key={copy} className="flex min-w-[100vw] shrink-0 items-center gap-8 py-2 pr-8 text-[10px] font-medium uppercase sm:text-xs">
            {tickerMessages.map((message, index) => (
              <span key={`${index}-${message}`} className="flex shrink-0 items-center gap-8">
                {message}
                <Waves className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
