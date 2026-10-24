import { beforeEach, describe, expect, it } from 'vitest';
import { api, bearer, cartWith, createUser, seedCatalog, shippingAddress } from './helpers.js';
import { Product } from '../src/models/product.js';
import { SHIPPING_FEE } from '../src/utils/pricing.js';

let products;
let token;

beforeEach(async () => {
  ({ products } = await seedCatalog());
  ({ token } = await createUser());
});

const bySlug = (slug) => products.find((p) => p.slug === slug);
const placeOrder = (t = token) =>
  api().post('/api/v1/orders').set(bearer(t)).send({ shippingAddress });

describe('POST /api/v1/orders', () => {
  it('rejects an empty cart', async () => {
    const res = await placeOrder();
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Your cart is empty');
  });

  it('validates the shipping address', async () => {
    await cartWith(token, [{ productId: bySlug('cork-yoga-mat').id, qty: 1 }]);
    const res = await api()
      .post('/api/v1/orders')
      .set(bearer(token))
      .send({ shippingAddress: { fullName: 'A' } });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('creates an order from the cart, snapshots items, decrements stock and empties the cart', async () => {
    const mat = bySlug('cork-yoga-mat');
    const bottle = bySlug('insulated-steel-bottle-1l');
    await cartWith(token, [
      { productId: mat.id, qty: 2 },
      { productId: bottle.id, qty: 1 },
    ]);

    const res = await placeOrder();
    expect(res.status).toBe(201);
    const { order } = res.body;
    expect(order.status).toBe('placed');
    expect(order.payment).toMatchObject({ provider: 'mock', status: 'pending' });
    expect(order.items).toHaveLength(2);
    expect(order.items.find((i) => i.slug === mat.slug)).toMatchObject({
      qty: 2,
      price: mat.price,
      name: mat.name,
    });
    const subtotal = mat.price * 2 + bottle.price;
    expect(order.totals).toEqual({
      subtotal,
      shipping: subtotal >= 99900 ? 0 : SHIPPING_FEE,
      total: subtotal + (subtotal >= 99900 ? 0 : SHIPPING_FEE),
    });
    expect(order.statusHistory).toEqual([expect.objectContaining({ status: 'placed' })]);

    const freshMat = await Product.findById(mat.id);
    expect(freshMat.stock).toBe(mat.stock - 2);

    const cart = await api().get('/api/v1/cart').set(bearer(token));
    expect(cart.body.cart.items).toHaveLength(0);
  });

  it('fails with 409 when stock ran out after the item was carted, and releases earlier reservations', async () => {
    const mat = bySlug('cork-yoga-mat');
    const watch = bySlug('trail-gps-watch');
    await cartWith(token, [
      { productId: mat.id, qty: 1 },
      { productId: watch.id, qty: 2 },
    ]);
    await Product.updateOne({ _id: watch.id }, { stock: 1 });

    const res = await placeOrder();
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('INSUFFICIENT_STOCK');
    expect(res.body.error.details).toMatchObject({
      productId: watch.id,
      requested: 2,
      available: 1,
    });

    expect((await Product.findById(mat.id)).stock).toBe(mat.stock);
    const cart = await api().get('/api/v1/cart').set(bearer(token));
    expect(cart.body.cart.items).toHaveLength(2);
  });
});

describe('my orders', () => {
  let orderId;

  beforeEach(async () => {
    await cartWith(token, [{ productId: bySlug('brass-fountain-pen').id, qty: 1 }]);
    orderId = (await placeOrder()).body.order.id;
  });

  it("lists and fetches only the current user's orders", async () => {
    const list = await api().get('/api/v1/orders/mine').set(bearer(token));
    expect(list.body.items.map((o) => o.id)).toEqual([orderId]);

    const one = await api().get(`/api/v1/orders/mine/${orderId}`).set(bearer(token));
    expect(one.status).toBe(200);

    const other = await createUser();
    const denied = await api().get(`/api/v1/orders/mine/${orderId}`).set(bearer(other.token));
    expect(denied.status).toBe(404);
    const otherList = await api().get('/api/v1/orders/mine').set(bearer(other.token));
    expect(otherList.body.items).toHaveLength(0);
  });

  it('completes a mock payment once and refuses a second one', async () => {
    const paid = await api()
      .post(`/api/v1/orders/mine/${orderId}/pay`)
      .set(bearer(token))
      .send({ cardLast4: '4242' });
    expect(paid.status).toBe(200);
    expect(paid.body.order.status).toBe('paid');
    expect(paid.body.order.payment).toMatchObject({
      status: 'paid',
      reference: expect.stringMatching(/^MOCK-/),
    });
    expect(paid.body.order.statusHistory.map((h) => h.status)).toEqual(['placed', 'paid']);

    const again = await api()
      .post(`/api/v1/orders/mine/${orderId}/pay`)
      .set(bearer(token))
      .send({});
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe('ALREADY_PAID');
  });

  it('cancelling restores stock and refunds a paid order', async () => {
    const pen = bySlug('brass-fountain-pen');
    await api().post(`/api/v1/orders/mine/${orderId}/pay`).set(bearer(token)).send({});
    const res = await api().post(`/api/v1/orders/mine/${orderId}/cancel`).set(bearer(token));
    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe('cancelled');
    expect(res.body.order.payment.status).toBe('refunded');
    expect((await Product.findById(pen.id)).stock).toBe(pen.stock);
  });

  it('cannot cancel an order that has already shipped', async () => {
    const { Order } = await import('../src/models/order.js');
    await Order.updateOne({ _id: orderId }, { status: 'shipped' });
    const res = await api().post(`/api/v1/orders/mine/${orderId}/cancel`).set(bearer(token));
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');
    expect(res.body.error.details.allowed).toEqual(['delivered']);
  });
});
