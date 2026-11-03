import type { Slide } from "@/lib/content";
import { isStagedHeroImage, removeStagedHeroImage, stagedHeroFile } from "@/lib/hero-image-staging";
import { removeUncommittedImages, uploadImage } from "@/lib/media-client";

const DRAFT_KEY = "eterea-admin-hero-draft";
type SavedDraft = { base: string; data: Slide[]; structureDirty: boolean };

export function loadHeroDraft(saved: Slide[]): SavedDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (navigation?.type === "reload") {
      discardHeroDraft(raw);
      return null;
    }
    const parsed = JSON.parse(raw) as SavedDraft;
    if (parsed.base !== JSON.stringify(saved) || !Array.isArray(parsed.data) || parsed.data.length > 30) {
      discardHeroDraft(raw);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function discardHeroDraft(raw: string) {
  localStorage.removeItem(DRAFT_KEY);
  try {
    const parsed = JSON.parse(raw) as Partial<SavedDraft>;
    if (!Array.isArray(parsed.data)) return;
    const markers = parsed.data.flatMap((slide) => {
      if (!slide || typeof slide !== "object") return [];
      const image = (slide as Slide).img;
      return typeof image === "string" && isStagedHeroImage(image) ? [image] : [];
    });
    void clearStagedHeroImages(markers);
  } catch {
    // El borrador se descarta aunque su contenido ya no se pueda interpretar.
  }
}

export function persistHeroDraft(saved: Slide[], data: Slide[], structureDirty: boolean) {
  try {
    if (JSON.stringify(saved) === JSON.stringify(data)) localStorage.removeItem(DRAFT_KEY);
    else localStorage.setItem(DRAFT_KEY, JSON.stringify({
      base: JSON.stringify(saved), data, structureDirty,
    } satisfies SavedDraft));
  } catch {
    // El editor sigue disponible si el almacenamiento local está bloqueado.
  }
}

export async function uploadStagedHeroImages(slides: Slide[]) {
  const uploads: string[] = [];
  const uploadedByMarker = new Map<string, string>();
  try {
    const data = [] as Slide[];
    for (const slide of slides) {
      if (!isStagedHeroImage(slide.img)) {
        data.push(slide);
        continue;
      }
      let url = uploadedByMarker.get(slide.img);
      if (!url) {
        url = await uploadImage(await stagedHeroFile(slide.img), "banners");
        uploads.push(url);
        uploadedByMarker.set(slide.img, url);
      }
      data.push({ ...slide, img: url });
    }
    return { data, uploads, uploadedByMarker };
  } catch (error) {
    await removeUncommittedImages(uploads).catch(() => undefined);
    throw error;
  }
}

export async function clearStagedHeroImages(markers: Iterable<string>) {
  await Promise.allSettled([...markers].map((marker) => removeStagedHeroImage(marker)));
}

export function mergeHeroDraft(savedBefore: Slide[], current: Slide[], savedAfter: Slide[], uploadedByMarker = new Map<string, string>()) {
  return savedAfter.map((saved, index) => {
    const draft = current[index];
    if (!draft || JSON.stringify(draft) === JSON.stringify(savedBefore[index])) return saved;
    const img = uploadedByMarker.get(draft.img) ?? draft.img;
    if (JSON.stringify({ ...draft, img }) === JSON.stringify({ ...saved, id: draft.id })) return saved;
    return { ...draft, id: saved.id, img };
  });
}
