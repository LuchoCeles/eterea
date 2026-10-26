import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { groupProductRelations, type ProductRelationRow } from "@/lib/product-relations";

type RelationsDb = Pick<Prisma.TransactionClient, "$queryRaw">;

export async function loadProductRelations(db: RelationsDb) {
  const rows = await db.$queryRaw<ProductRelationRow[]>`
    SELECT productId, position, 'image' AS kind, url AS value, NULL AS price, '' AS rowId, false AS soldOut FROM ProductImage
    UNION ALL SELECT productId, position, 'size', label, NULL, '', false FROM ProductSize
    UNION ALL SELECT productId, position, 'color', label, NULL, '', soldOut FROM ProductColor
    UNION ALL SELECT productId, position, 'payment', label, price, id, false FROM ProductPaymentPrice WHERE active = true
  `;
  return groupProductRelations(rows);
}
