import "server-only";
import { cache } from "react";
import { loadContentSnapshot } from "@/server/content";
import { loadInstagramProfile } from "@/server/instagram";

export const loadStorefrontContent = cache(async () => {
  const [content, profile] = await Promise.all([loadContentSnapshot(), loadInstagramProfile()]);
  if (profile) content.contact = { ...content.contact, instagramUsername: profile.username };
  return content;
});
