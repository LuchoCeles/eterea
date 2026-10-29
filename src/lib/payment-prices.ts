export function calculateDiscountedPrice(basePrice: number, discountPercent: number): number {
  return Math.round(basePrice * (100 - discountPercent)) / 100;
}

export function rebasePaymentPrices<T extends { price: number }>(
  prices: T[],
  previousReference: number,
  nextReference: number,
  discountPercents: (number | null)[],
): T[] {
  return prices.map((price, index) => ({
    ...price,
    price: discountPercents[index] !== null && discountPercents[index] !== undefined
      ? calculateDiscountedPrice(nextReference, discountPercents[index])
      : previousReference > 0
        ? Math.round(price.price * nextReference / previousReference * 100) / 100
        : nextReference,
  }));
}
