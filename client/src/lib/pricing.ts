// Mirrors server/src/utils/pricing.js. Amounts are integers in minor units (paise).
export const FREE_SHIPPING_THRESHOLD = 99900;
export const SHIPPING_FEE = 4900;

export interface Totals {
  subtotal: number;
  shipping: number;
  total: number;
}

export function computeTotals(items: ReadonlyArray<{ price: number; qty: number }>): Totals {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  return { subtotal, shipping, total: subtotal + shipping };
}

export function amountToFreeShipping(subtotal: number): number {
  return Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
}
