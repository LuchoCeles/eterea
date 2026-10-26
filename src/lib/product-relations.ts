export type ProductRelationRow = {
  productId: string;
  position: number;
  kind: string;
  value: string;
  price: unknown;
  rowId: string;
};

type Entry = { position: number; rowId: string; value: string; price: unknown };
type Group = { images: Entry[]; sizes: Entry[]; colors: Entry[]; payments: Entry[] };

export function groupProductRelations(rows: ProductRelationRow[]) {
  const groups = new Map<string, Group>();
  for (const row of rows) {
    let group = groups.get(row.productId);
    if (!group) {
      group = { images: [], sizes: [], colors: [], payments: [] };
      groups.set(row.productId, group);
    }
    const entry = { position: row.position, rowId: row.rowId, value: row.value, price: row.price };
    if (row.kind === "image") group.images.push(entry);
    else if (row.kind === "size") group.sizes.push(entry);
    else if (row.kind === "color") group.colors.push(entry);
    else if (row.kind === "payment") group.payments.push(entry);
    else throw new Error("La relación de producto no tiene un tipo válido.");
  }

  const sorted = (entries: Entry[]) => entries.sort((a, b) => a.position - b.position || a.rowId.localeCompare(b.rowId));
  return new Map([...groups].map(([productId, group]) => [productId, {
    images: sorted(group.images).map((item) => item.value),
    sizes: sorted(group.sizes).map((item) => item.value),
    colors: sorted(group.colors).map((item) => item.value),
    paymentPrices: sorted(group.payments).map((item) => {
      const price = Number(item.price);
      if (item.price === null || !Number.isFinite(price)) throw new Error("El precio guardado no es válido.");
      return { label: item.value, price };
    }),
  }]));
}
