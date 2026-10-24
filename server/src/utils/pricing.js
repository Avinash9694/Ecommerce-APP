// Amounts are integers in the currency's minor unit (paise for INR).
export const FREE_SHIPPING_THRESHOLD = 99900;
export const SHIPPING_FEE = 4900;

export function computeTotals(items) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  return { subtotal, shipping, total: subtotal + shipping };
}
