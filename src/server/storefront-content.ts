import "server-only";
import { cache } from "react";
import { revalidateTag, unstable_cache } from "next/cache";
import { defaultContentSnapshot, loadContentSnapshot } from "@/server/content";
import { loadInstagramConnectionInfo } from "@/server/instagram";

const contentTag = "eterea-storefront-content";

const loadCachedContent = unstable_cache(async () => {
  const [content, instagram] = await Promise.all([loadContentSnapshot({ strict: true }), loadInstagramConnectionInfo()]);
  return {
    content: { ...content, contact: { ...content.contact, instagramUsername: instagram.username ?? "" } },
    instagramConnected: instagram.connected,
  };
}, [contentTag], { tags: [contentTag], revalidate: 300 });

export const loadStorefrontData = cache(async () => {
  try {
    return await loadCachedContent();
  } catch {
    return { content: defaultContentSnapshot(), instagramConnected: false };
  }
});

export const loadStorefrontContent = cache(async () => (await loadStorefrontData()).content);

export function invalidateStorefrontContent() {
  revalidateTag(contentTag, { expire: 0 });
}
