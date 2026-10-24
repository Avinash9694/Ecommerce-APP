import { beforeEach, describe, expect, it } from 'vitest';
import { api, bearer, cartWith, createUser, seedCatalog } from './helpers.js';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from '../src/utils/pricing.js';

let products;
let token;

beforeEach(async () => {
  ({ products } = await seedCatalog());
  ({ token } = await createUser());
});

const cheap = () => products.find((p) => p.slug === 'linen-hardcover-notebook');
const pricey = () => products.find((p) => p.slug === 'horizon-smartwatch');
const scarce = () => products.find((p) => p.slug === 'trail-gps-watch');

describe('cart', () => {
  it('requires authentication', async () => {
    const res = await api().get('/api/v1/cart');
    expect(res.status).toBe(401);
  });

  it('returns an empty cart for a new user', async () => {
    const res = await api().get('/api/v1/cart').set(bearer(token));
    expect(res.status).toBe(200);
    expect(res.body.cart).toMatchObject({
      items: [],
      itemCount: 0,
      totals: { subtotal: 0, shipping: 0, total: 0 },
    });
  });

  it('adds an item and computes line and cart totals', async () => {
    const res = await cartWith(token, [{ productId: cheap().id, qty: 2 }]);
    expect(res.status).toBe(200);
    const { cart } = res.body;
    expect(cart.itemCount).toBe(2);
    expect(cart.items[0]).toMatchObject({ qty: 2, lineTotal: cheap().price * 2 });
    expect(cart.items[0].product).toMatchObject({ slug: cheap().slug, stock: cheap().stock });
    expect(cart.totals.subtotal).toBe(cheap().price * 2);
  });

  it('increments quantity when the same product is added twice', async () => {
    const res = await cartWith(token, [
      { productId: cheap().id, qty: 1 },
      { productId: cheap().id, qty: 3 },
    ]);
    expect(res.body.cart.items).toHaveLength(1);
    expect(res.body.cart.items[0].qty).toBe(4);
  });

  it('charges shipping below the free-shipping threshold and none above it', async () => {
    const below = await cartWith(token, [{ productId: cheap().id, qty: 1 }]);
    expect(below.body.cart.totals.subtotal).toBeLessThan(FREE_SHIPPING_THRESHOLD);
    expect(below.body.cart.totals.shipping).toBe(SHIPPING_FEE);
    expect(below.body.cart.totals.total).toBe(cheap().price + SHIPPING_FEE);

    const above = await cartWith(token, [{ productId: pricey().id, qty: 1 }]);
    expect(above.body.cart.totals.subtotal).toBeGreaterThanOrEqual(FREE_SHIPPING_THRESHOLD);
    expect(above.body.cart.totals.shipping).toBe(0);
  });

  it('rejects adding more than the available stock', async () => {
    const res = await cartWith(token, [{ productId: scarce().id, qty: scarce().stock + 1 }]);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('INSUFFICIENT_STOCK');
    expect(res.body.error.details).toMatchObject({ available: scarce().stock });
  });

  it('rejects a cumulative quantity over stock', async () => {
    await cartWith(token, [{ productId: scarce().id, qty: scarce().stock }]);
    const res = await cartWith(token, [{ productId: scarce().id, qty: 1 }]);
    expect(res.status).toBe(409);
  });

  it('updates a line quantity and removes it at zero', async () => {
    await cartWith(token, [{ productId: cheap().id, qty: 1 }]);
    const updated = await api()
      .patch(`/api/v1/cart/items/${cheap().id}`)
      .set(bearer(token))
      .send({ qty: 5 });
    expect(updated.body.cart.items[0].qty).toBe(5);

    const removed = await api()
      .patch(`/api/v1/cart/items/${cheap().id}`)
      .set(bearer(token))
      .send({ qty: 0 });
    expect(removed.body.cart.items).toHaveLength(0);
  });

  it('returns 404 when updating a product that is not in the cart', async () => {
    const res = await api()
      .patch(`/api/v1/cart/items/${cheap().id}`)
      .set(bearer(token))
      .send({ qty: 1 });
    expect(res.status).toBe(404);
  });

  it('removes a single item and clears the cart', async () => {
    await cartWith(token, [
      { productId: cheap().id, qty: 1 },
      { productId: pricey().id, qty: 1 },
    ]);
    const removed = await api().delete(`/api/v1/cart/items/${cheap().id}`).set(bearer(token));
    expect(removed.body.cart.items).toHaveLength(1);
    expect(removed.body.cart.items[0].product.slug).toBe(pricey().slug);

    const cleared = await api().delete('/api/v1/cart').set(bearer(token));
    expect(cleared.body.cart.items).toHaveLength(0);
  });

  it('validates the body and rejects unknown products', async () => {
    const bad = await api()
      .post('/api/v1/cart/items')
      .set(bearer(token))
      .send({ productId: 'x', qty: 0 });
    expect(bad.status).toBe(400);

    const missing = await api()
      .post('/api/v1/cart/items')
      .set(bearer(token))
      .send({ productId: '64b000000000000000000000', qty: 1 });
    expect(missing.status).toBe(404);
  });

  it('keeps carts separate per user', async () => {
    const other = await createUser();
    await cartWith(token, [{ productId: cheap().id, qty: 1 }]);
    const res = await api().get('/api/v1/cart').set(bearer(other.token));
    expect(res.body.cart.items).toHaveLength(0);
  });
});
