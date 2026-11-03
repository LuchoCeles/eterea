"use client";

import { saveContentAction, saveHeroSlideAction, saveTextSectionAction } from "@/app/actions/content";
import type { ContentKey, Slide, TextSectionKey, Texts } from "@/lib/content";

export async function saveContent(key: ContentKey, data: unknown, uploadedUrls: string[] = []) {
  const result = await saveContentAction(key, data, uploadedUrls);
  if ("error" in result) throw new Error(result.error);
  return result;
}

export async function saveHeroSlide(index: number, slide: Slide, uploadedUrls: string[] = []) {
  const result = await saveHeroSlideAction(index, slide, uploadedUrls);
  if ("error" in result) throw new Error(result.error);
  return result.data;
}

export async function saveTextSection<K extends TextSectionKey>(section: K, data: Texts[K], uploadedUrls: string[] = []) {
  const result = await saveTextSectionAction(section, data, uploadedUrls);
  if ("error" in result) throw new Error(result.error);
  return result.data;
}
