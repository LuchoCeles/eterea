import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { groupProductRelations, type ProductRelationRow } from "@/lib/product-relations";
import type { CropSettings, ImageSettings, ImageFormat } from "@/lib/image-presentation";

type RelationsDb = Pick<Prisma.TransactionClient, "$queryRaw" | "productColor" | "productImage">;

export async function loadProductRelations(db: RelationsDb) {
  const [rows, colors, imageRows] = await Promise.all([db.$queryRaw<ProductRelationRow[]>`
    SELECT productId, position, 'image' AS kind, url AS value, NULL AS price, '' AS rowId, false AS soldOut FROM ProductImage
    UNION ALL SELECT productId, position, 'size', label, NULL, '', false FROM ProductSize
    UNION ALL SELECT productId, position, 'payment', label, price, id, false FROM ProductPaymentPrice WHERE active = true
  `, db.productColor.findMany({ select: { productId: true, position: true, label: true, soldOut: true } }),
    db.productImage.findMany({ orderBy: { position: "asc" } })]);
  const grouped = groupProductRelations([...rows, ...colors.map((color) => ({
    productId: color.productId, position: color.position, kind: "color", value: color.label,
    price: null, rowId: "", soldOut: color.soldOut,
  }))]);
  const settings = new Map<string, { imageSettings: (ImageSettings | null)[]; coverSettings: CropSettings | null }>();
  for (const row of imageRows) {
    let item = settings.get(row.productId);
    if (!item) {
      item = { imageSettings: [], coverSettings: null };
      settings.set(row.productId, item);
    }
    const dimensions = row.sourceWidth && row.sourceHeight
      ? { width: row.sourceWidth, height: row.sourceHeight } : null;
    item.imageSettings.push(dimensions && row.format && row.zoom != null && row.offsetX != null && row.offsetY != null
      ? { ...dimensions, format: row.format as ImageFormat, zoom: row.zoom, x: row.offsetX, y: row.offsetY }
      : null);
    if (row.position === 0 && dimensions && row.coverZoom != null && row.coverX != null && row.coverY != null) {
      item.coverSettings = { ...dimensions, zoom: row.coverZoom, x: row.coverX, y: row.coverY };
    }
  }
  for (const [productId, item] of grouped) {
    const presentation = settings.get(productId);
    if (presentation) Object.assign(item, presentation);
  }
  return grouped as Map<string, (typeof grouped extends Map<string, infer V> ? V : never) & {
    imageSettings?: (ImageSettings | null)[]; coverSettings?: CropSettings | null;
  }>;
}
