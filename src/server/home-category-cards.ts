import type { Prisma } from "@/generated/prisma/client";
import type { HomeCategoryCard } from "@/lib/content";

type CardDb = Pick<Prisma.TransactionClient, "homeCategoryCard">;

export async function saveHomeCategoryCardRows(db: CardDb, cards: HomeCategoryCard[]) {
  const current = await db.homeCategoryCard.findMany();
  const currentById = new Map(current.map((card) => [card.id, card]));
  const nextById = new Map(cards.map((card) => [card.id, card]));
  const removedIds = current.filter((card) => nextById.get(card.id)?.categoryId !== card.categoryId).map((card) => card.id);
  if (removedIds.length) await db.homeCategoryCard.deleteMany({ where: { id: { in: removedIds } } });

  for (const [position, card] of cards.entries()) {
    const previous = currentById.get(card.id);
    if (previous?.categoryId === card.categoryId && previous.position === position && previous.img === card.img
      && previous.productId === (card.productId ?? null) && previous.hidden === (card.hidden !== false)) continue;
    const data = { categoryId: card.categoryId, productId: card.productId ?? null, img: card.img, hidden: card.hidden !== false, position };
    await db.homeCategoryCard.upsert({ where: { id: card.id }, create: { id: card.id, ...data }, update: data });
  }
  return current.map((card) => card.img);
}
