import type { Prisma } from "@/generated/prisma/client";
import type { HomeCategoryCard } from "@/lib/content";
import type { CropSettings } from "@/lib/image-presentation";

type CardDb = Pick<Prisma.TransactionClient, "homeCategoryCard">;
type CurrentCard = {
  id: string; categoryId: string; img: string; hidden: boolean; productId: string | null; position: number;
  imageZoom?: number | null; imageX?: number | null; imageY?: number | null;
  imageWidth?: number | null; imageHeight?: number | null;
};

function imageSettingsColumns(settings?: CropSettings | null) {
  return {
    imageZoom: settings?.zoom ?? null,
    imageX: settings?.x ?? null,
    imageY: settings?.y ?? null,
    imageWidth: settings?.width ?? null,
    imageHeight: settings?.height ?? null,
  };
}

export async function saveHomeCategoryCardRows(db: CardDb, cards: HomeCategoryCard[], currentRows?: CurrentCard[]) {
  const current = currentRows ?? await db.homeCategoryCard.findMany();
  const currentById = new Map(current.map((card) => [card.id, card]));
  const nextById = new Map(cards.map((card) => [card.id, card]));
  const removedIds = current.filter((card) => nextById.get(card.id)?.categoryId !== card.categoryId).map((card) => card.id);
  if (removedIds.length) await db.homeCategoryCard.deleteMany({ where: { id: { in: removedIds } } });

  for (const [position, card] of cards.entries()) {
    const previous = currentById.get(card.id);
    const imageSettings = imageSettingsColumns(card.imageSettings);
    const hadImageSettings = !!previous && [previous.imageZoom, previous.imageX, previous.imageY,
      previous.imageWidth, previous.imageHeight].some((value) => value != null);
    if (previous?.categoryId === card.categoryId && previous.position === position && previous.img === card.img
      && previous.productId === (card.productId ?? null) && previous.hidden === (card.hidden !== false)
      && (previous.imageZoom ?? null) === imageSettings.imageZoom && (previous.imageX ?? null) === imageSettings.imageX
      && (previous.imageY ?? null) === imageSettings.imageY && (previous.imageWidth ?? null) === imageSettings.imageWidth
      && (previous.imageHeight ?? null) === imageSettings.imageHeight) continue;
    const data = { categoryId: card.categoryId, productId: card.productId ?? null, img: card.img,
      hidden: card.hidden !== false, position, ...(card.imageSettings || hadImageSettings ? imageSettings : {}) };
    await db.homeCategoryCard.upsert({ where: { id: card.id }, create: { id: card.id, ...data }, update: data });
  }
  return current.map((card) => card.img);
}
