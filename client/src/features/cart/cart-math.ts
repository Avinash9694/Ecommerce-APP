import type { Cart, CartItem, CartProduct } from '@/api';
import { computeTotals } from '@/lib/pricing';

export const EMPTY_CART: Cart = {
  id: 'empty',
  items: [],
  itemCount: 0,
  totals: { subtotal: 0, shipping: 0, total: 0 },
};

function finalize(id: string, items: CartItem[]): Cart {
  const normalised = items.map((item) => ({ ...item, lineTotal: item.product.price * item.qty }));
  return {
    id,
    items: normalised,
    itemCount: normalised.reduce((sum, i) => sum + i.qty, 0),
    totals: computeTotals(normalised.map((i) => ({ price: i.product.price, qty: i.qty }))),
  };
}

/** Pure cart transitions used for optimistic updates; the server result replaces them. */
export function withItemAdded(cart: Cart, product: CartProduct, qty: number): Cart {
  const existing = cart.items.find((i) => i.product.id === product.id);
  const items = existing
    ? cart.items.map((i) => (i.product.id === product.id ? { ...i, qty: i.qty + qty } : i))
    : [...cart.items, { product, qty, lineTotal: product.price * qty }];
  return finalize(cart.id, items);
}

export function withItemQty(cart: Cart, productId: string, qty: number): Cart {
  const items =
    qty <= 0
      ? cart.items.filter((i) => i.product.id !== productId)
      : cart.items.map((i) => (i.product.id === productId ? { ...i, qty } : i));
  return finalize(cart.id, items);
}

export function withoutItem(cart: Cart, productId: string): Cart {
  return finalize(
    cart.id,
    cart.items.filter((i) => i.product.id !== productId),
  );
}

export const emptied = (cart: Cart): Cart => finalize(cart.id, []);
