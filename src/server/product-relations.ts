import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { groupProductRelations, type ProductRelationRow } from "@/lib/product-relations";

type RelationsDb = Pick<Prisma.TransactionClient, "$queryRaw">;

export async function loadProductRelations(db: RelationsDb) {
  const rows = await db.$queryRaw<ProductRelationRow[]>`
    SELECT productId, position, 'image' AS kind, url AS value, NULL AS price, '' AS rowId FROM ProductImage
    UNION ALL SELECT productId, position, 'size', label, NULL, '' FROM ProductSize
    UNION ALL SELECT productId, position, 'color', label, NULL, '' FROM ProductColor
    UNION ALL SELECT productId, position, 'payment', label, price, id FROM ProductPaymentPrice WHERE active = true
  `;
  return groupProductRelations(rows);
}
