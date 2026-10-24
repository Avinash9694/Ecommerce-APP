import { describe, expect, it } from 'vitest';
import type { Cart, CartProduct } from '@/api';
import { SHIPPING_FEE } from '@/lib/pricing';
import { EMPTY_CART, emptied, withItemAdded, withItemQty, withoutItem } from '../cart-math';

const pen: CartProduct = {
  id: 'p1',
  name: 'Pen',
  slug: 'pen',
  price: 219900,
  currency: 'INR',
  images: [],
  stock: 10,
};
const notebook: CartProduct = {
  id: 'p2',
  name: 'Notebook',
  slug: 'notebook',
  price: 69900,
  currency: 'INR',
  images: [],
  stock: 10,
};

describe('cart math', () => {
  it('adds a new line and recomputes totals', () => {
    const cart = withItemAdded(EMPTY_CART, notebook, 2);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]).toMatchObject({ qty: 2, lineTotal: 139800 });
    expect(cart.itemCount).toBe(2);
    expect(cart.totals).toEqual({ subtotal: 139800, shipping: 0, total: 139800 });
  });

  it('increments an existing line instead of duplicating it', () => {
    const cart = withItemAdded(withItemAdded(EMPTY_CART, pen, 1), pen, 2);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]?.qty).toBe(3);
  });

  it('charges shipping on a small cart and drops it once over the threshold', () => {
    const small = withItemAdded(EMPTY_CART, notebook, 1);
    expect(small.totals.shipping).toBe(SHIPPING_FEE);
    const bigger = withItemAdded(small, pen, 1);
    expect(bigger.totals.shipping).toBe(0);
  });

  it('sets a quantity and removes the line at zero', () => {
    const cart: Cart = withItemAdded(withItemAdded(EMPTY_CART, pen, 1), notebook, 1);
    const updated = withItemQty(cart, 'p1', 4);
    expect(updated.items.find((i) => i.product.id === 'p1')?.qty).toBe(4);
    const removed = withItemQty(updated, 'p1', 0);
    expect(removed.items.map((i) => i.product.id)).toEqual(['p2']);
  });

  it('removes a line and empties the cart', () => {
    const cart = withItemAdded(withItemAdded(EMPTY_CART, pen, 1), notebook, 1);
    expect(withoutItem(cart, 'p2').items).toHaveLength(1);
    const empty = emptied(cart);
    expect(empty.items).toHaveLength(0);
    expect(empty.totals.total).toBe(0);
  });
});
