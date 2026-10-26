import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { groupProductRelations, type ProductRelationRow } from "@/lib/product-relations";

type RelationsDb = Pick<Prisma.TransactionClient, "$queryRaw" | "productColor">;

export async function loadProductRelations(db: RelationsDb) {
  const [rows, colors] = await Promise.all([db.$queryRaw<ProductRelationRow[]>`
    SELECT productId, position, 'image' AS kind, url AS value, NULL AS price, '' AS rowId, false AS soldOut FROM ProductImage
    UNION ALL SELECT productId, position, 'size', label, NULL, '', false FROM ProductSize
    UNION ALL SELECT productId, position, 'payment', label, price, id, false FROM ProductPaymentPrice WHERE active = true
  `, db.productColor.findMany({ select: { productId: true, position: true, label: true, soldOut: true } })]);
  return groupProductRelations([...rows, ...colors.map((color) => ({
    productId: color.productId, position: color.position, kind: "color", value: color.label,
    price: null, rowId: "", soldOut: color.soldOut,
  }))]);
}
