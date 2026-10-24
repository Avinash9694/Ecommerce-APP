import { describe, expect, it } from 'vitest';
import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE,
  amountToFreeShipping,
  computeTotals,
} from '../pricing';

describe('computeTotals', () => {
  it('returns zeros for an empty cart and charges no shipping', () => {
    expect(computeTotals([])).toEqual({ subtotal: 0, shipping: 0, total: 0 });
  });

  it('charges the flat fee below the free-shipping threshold', () => {
    const totals = computeTotals([{ price: 69900, qty: 1 }]);
    expect(totals).toEqual({
      subtotal: 69900,
      shipping: SHIPPING_FEE,
      total: 69900 + SHIPPING_FEE,
    });
  });

  it('ships free exactly at the threshold', () => {
    const totals = computeTotals([{ price: FREE_SHIPPING_THRESHOLD, qty: 1 }]);
    expect(totals.shipping).toBe(0);
    expect(totals.total).toBe(FREE_SHIPPING_THRESHOLD);
  });

  it('sums multiple lines with quantities in integer minor units', () => {
    const totals = computeTotals([
      { price: 149900, qty: 2 },
      { price: 69900, qty: 3 },
    ]);
    expect(totals.subtotal).toBe(149900 * 2 + 69900 * 3);
    expect(Number.isInteger(totals.total)).toBe(true);
  });

  it('reports how much more is needed for free shipping, never negative', () => {
    expect(amountToFreeShipping(50000)).toBe(FREE_SHIPPING_THRESHOLD - 50000);
    expect(amountToFreeShipping(FREE_SHIPPING_THRESHOLD + 1)).toBe(0);
  });
});
