import { beforeEach, describe, expect, it } from 'vitest';
import {
  api,
  bearer,
  cartWith,
  createAdmin,
  createUser,
  seedCatalog,
  shippingAddress,
} from './helpers.js';
import { Product } from '../src/models/product.js';

let products;
let categories;
let admin;
let shopper;

beforeEach(async () => {
  ({ products, categories } = await seedCatalog());
  admin = await createAdmin();
  shopper = await createUser();
});

describe('admin products', () => {
  const body = () => ({
    name: 'Field Notes Pack',
    description: 'Three pocket notebooks with graph paper.',
    price: 49900,
    category: categories[0].id,
    stock: 10,
    tags: ['notebook'],
  });

  it('forbids a shopper from creating, updating or deleting products', async () => {
    const create = await api().post('/api/v1/products').set(bearer(shopper.token)).send(body());
    expect(create.status).toBe(403);
    const patch = await api()
      .patch(`/api/v1/products/${products[0].id}`)
      .set(bearer(shopper.token))
      .send({ stock: 1 });
    expect(patch.status).toBe(403);
    const del = await api().delete(`/api/v1/products/${products[0].id}`).set(bearer(shopper.token));
    expect(del.status).toBe(403);
  });

  it('creates a product with a derived slug and populated category', async () => {
    const res = await api().post('/api/v1/products').set(bearer(admin.token)).send(body());
    expect(res.status).toBe(201);
    expect(res.body.product).toMatchObject({
      slug: 'field-notes-pack',
      currency: 'INR',
      featured: false,
    });
    expect(res.body.product.category.id).toBe(categories[0].id);
  });

  it('de-duplicates derived slugs', async () => {
    await api().post('/api/v1/products').set(bearer(admin.token)).send(body());
    const res = await api().post('/api/v1/products').set(bearer(admin.token)).send(body());
    expect(res.status).toBe(201);
    expect(res.body.product.slug).toBe('field-notes-pack-2');
  });

  it('rejects a non-integer price and an unknown category', async () => {
    const float = await api()
      .post('/api/v1/products')
      .set(bearer(admin.token))
      .send({ ...body(), price: 499.5 });
    expect(float.status).toBe(400);
    const unknown = await api()
      .post('/api/v1/products')
      .set(bearer(admin.token))
      .send({ ...body(), category: '64b000000000000000000000' });
    expect(unknown.status).toBe(400);
    expect(unknown.body.error.details[0].path).toBe('category');
  });

  it('updates and deletes a product', async () => {
    const patch = await api()
      .patch(`/api/v1/products/${products[0].id}`)
      .set(bearer(admin.token))
      .send({ stock: 3, featured: true });
    expect(patch.status).toBe(200);
    expect(patch.body.product).toMatchObject({ stock: 3, featured: true, slug: products[0].slug });

    const del = await api().delete(`/api/v1/products/${products[0].id}`).set(bearer(admin.token));
    expect(del.status).toBe(204);
    expect(await Product.findById(products[0].id)).toBeNull();

    const again = await api().delete(`/api/v1/products/${products[0].id}`).set(bearer(admin.token));
    expect(again.status).toBe(404);
  });
});

describe('admin orders', () => {
  let orderId;

  beforeEach(async () => {
    await cartWith(shopper.token, [{ productId: products[0].id, qty: 1 }]);
    const res = await api()
      .post('/api/v1/orders')
      .set(bearer(shopper.token))
      .send({ shippingAddress });
    orderId = res.body.order.id;
  });

  it('forbids a shopper from listing all orders or changing status', async () => {
    const list = await api().get('/api/v1/orders').set(bearer(shopper.token));
    expect(list.status).toBe(403);
    const patch = await api()
      .patch(`/api/v1/orders/${orderId}/status`)
      .set(bearer(shopper.token))
      .send({ status: 'shipped' });
    expect(patch.status).toBe(403);
  });

  it('lists all orders with the customer populated and filters by status', async () => {
    const res = await api().get('/api/v1/orders').set(bearer(admin.token));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ total: 1, page: 1 });
    expect(res.body.items[0].user).toMatchObject({ email: shopper.user.email });

    const none = await api().get('/api/v1/orders?status=shipped').set(bearer(admin.token));
    expect(none.body.total).toBe(0);
  });

  it('walks an order through valid transitions and rejects invalid ones', async () => {
    const skip = await api()
      .patch(`/api/v1/orders/${orderId}/status`)
      .set(bearer(admin.token))
      .send({ status: 'delivered' });
    expect(skip.status).toBe(409);
    expect(skip.body.error.code).toBe('INVALID_STATUS_TRANSITION');

    for (const status of ['paid', 'shipped', 'delivered']) {
      const res = await api()
        .patch(`/api/v1/orders/${orderId}/status`)
        .set(bearer(admin.token))
        .send({ status });
      expect(res.status).toBe(200);
      expect(res.body.order.status).toBe(status);
    }

    const final = await api().get(`/api/v1/orders/mine/${orderId}`).set(bearer(shopper.token));
    expect(final.body.order.statusHistory.map((h) => h.status)).toEqual([
      'placed',
      'paid',
      'shipped',
      'delivered',
    ]);
    expect(final.body.order.payment.status).toBe('paid');
  });

  it('cancelling from the admin side restores stock', async () => {
    const before = (await Product.findById(products[0].id)).stock;
    const res = await api()
      .patch(`/api/v1/orders/${orderId}/status`)
      .set(bearer(admin.token))
      .send({ status: 'cancelled' });
    expect(res.status).toBe(200);
    expect((await Product.findById(products[0].id)).stock).toBe(before + 1);
  });

  it('rejects an unknown status value', async () => {
    const res = await api()
      .patch(`/api/v1/orders/${orderId}/status`)
      .set(bearer(admin.token))
      .send({ status: 'lost' });
    expect(res.status).toBe(400);
  });
});

describe('platform', () => {
  it('reports health with the database state', async () => {
    const res = await api().get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', db: 'connected' });
  });

  it('returns a structured 404 for unknown routes', async () => {
    const res = await api().get('/api/v1/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 for malformed JSON', async () => {
    const res = await api()
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email":');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  it('denies browser origins that are not on the allowlist', async () => {
    const ok = await api().get('/api/v1/health').set('Origin', 'http://localhost:5173');
    expect(ok.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    const denied = await api().get('/api/v1/health').set('Origin', 'https://evil.example');
    expect(denied.status).toBe(403);
    expect(denied.body.error.code).toBe('CORS_ORIGIN_DENIED');
  });
});
