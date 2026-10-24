import { beforeEach, describe, expect, it } from 'vitest';
import { createDemoClient } from '../demo-client';
import { DEMO_ACCOUNTS } from '../demo-store';
import { setToken } from '@/api/session';
import { ApiError } from '@/api/types';

const KEY = 'test.demo';
const shopper = DEMO_ACCOUNTS[0]!;
const admin = DEMO_ACCOUNTS[1]!;

const address = {
  fullName: 'Asha Rao',
  line1: '12 Jubilee Hills Road',
  line2: '',
  city: 'Hyderabad',
  state: 'Telangana',
  postalCode: '500033',
  country: 'India',
  phone: '+91 98765 43210',
};

async function expectApiError(promise: Promise<unknown>, status: number, code: string) {
  await expect(promise).rejects.toBeInstanceOf(ApiError);
  await promise.catch((err: ApiError) => {
    expect(err.status).toBe(status);
    expect(err.code).toBe(code);
  });
}

describe('DemoApiClient', () => {
  beforeEach(() => {
    setToken(null);
    window.localStorage.clear();
  });

  const signIn = async (
    api = createDemoClient({ storageKey: KEY, latency: 0 }),
    account = shopper,
  ) => {
    const result = await api.auth.login({ email: account.email, password: account.password });
    setToken(result.token);
    return api;
  };

  describe('auth', () => {
    it('signs in the seeded demo accounts and exposes their roles', async () => {
      const api = createDemoClient({ storageKey: KEY, latency: 0 });
      const shopperResult = await api.auth.login({
        email: shopper.email,
        password: shopper.password,
      });
      expect(shopperResult.user.role).toBe('user');
      const adminResult = await api.auth.login({ email: admin.email, password: admin.password });
      expect(adminResult.user.role).toBe('admin');
      expect(
        (adminResult.user as unknown as { passwordHash?: string }).passwordHash,
      ).toBeUndefined();
    });

    it('rejects wrong credentials with 401 and the same message for unknown emails', async () => {
      const api = createDemoClient({ storageKey: KEY, latency: 0 });
      await expectApiError(
        api.auth.login({ email: shopper.email, password: 'nope' }),
        401,
        'INVALID_CREDENTIALS',
      );
      await expectApiError(
        api.auth.login({ email: 'ghost@shop.test', password: 'nope' }),
        401,
        'INVALID_CREDENTIALS',
      );
    });

    it('registers a new account, validates input and refuses duplicate emails', async () => {
      const api = createDemoClient({ storageKey: KEY, latency: 0 });
      await expectApiError(
        api.auth.register({ name: 'A', email: 'bad', password: 'short' }),
        400,
        'VALIDATION_ERROR',
      );
      const result = await api.auth.register({
        name: 'New User',
        email: 'New@Shop.test',
        password: 'password123',
      });
      expect(result.user.email).toBe('new@shop.test');
      await expectApiError(
        api.auth.register({ name: 'Again', email: 'new@shop.test', password: 'password123' }),
        409,
        'EMAIL_TAKEN',
      );
    });

    it('requires a session for /me and clears a stale token', async () => {
      const api = createDemoClient({ storageKey: KEY, latency: 0 });
      setToken('demo.stale');
      await expectApiError(api.auth.me(), 401, 'UNAUTHORIZED');
      await signIn(api);
      expect((await api.auth.me()).email).toBe(shopper.email);
    });
  });

  describe('persistence', () => {
    it('persists accounts, sessions and carts across client instances via localStorage', async () => {
      const first = createDemoClient({ storageKey: KEY, latency: 0 });
      const registered = await first.auth.register({
        name: 'Persisted',
        email: 'persist@shop.test',
        password: 'password123',
      });
      setToken(registered.token);
      const products = await first.products.list({ limit: 1 });
      await first.cart.add(products.items[0]!.id, 2);

      const second = createDemoClient({ storageKey: KEY, latency: 0 });
      expect((await second.auth.me()).name).toBe('Persisted');
      expect((await second.cart.get()).itemCount).toBe(2);
    });

    it('reset wipes all state back to the seed and signs out', async () => {
      const api = await signIn();
      const products = await api.products.list({ limit: 1 });
      await api.cart.add(products.items[0]!.id, 1);
      api.reset();
      await expectApiError(api.cart.get(), 401, 'UNAUTHORIZED');
      await signIn(api);
      expect((await api.cart.get()).items).toHaveLength(0);
    });
  });

  describe('products', () => {
    it('paginates, filters by category, searches and sorts', async () => {
      const api = createDemoClient({ storageKey: KEY, latency: 0 });
      const page = await api.products.list({ page: 2, limit: 10 });
      expect(page).toMatchObject({ page: 2, limit: 10, total: 24, totalPages: 3 });
      expect(page.items).toHaveLength(10);

      const fitness = await api.products.list({ category: 'fitness', limit: 50 });
      expect(fitness.total).toBe(4);

      const search = await api.products.list({ q: 'BLUETOOTH', limit: 50 });
      expect(search.total).toBe(3);

      const asc = (await api.products.list({ sort: 'price_asc', limit: 50 })).items.map(
        (p) => p.price,
      );
      expect(asc).toEqual([...asc].sort((a, b) => a - b));

      const priced = await api.products.list({ minPrice: 100000, maxPrice: 200000, limit: 50 });
      expect(priced.items.every((p) => p.price >= 100000 && p.price <= 200000)).toBe(true);
    });

    it('resolves a product by slug and 404s for unknown slugs', async () => {
      const api = createDemoClient({ storageKey: KEY, latency: 0 });
      const product = await api.products.getBySlug('cork-yoga-mat');
      expect(product.category.slug).toBe('fitness');
      await expectApiError(api.products.getBySlug('nope'), 404, 'NOT_FOUND');
    });
  });

  describe('cart and stock', () => {
    it('adds, increments, caps at stock, updates and removes lines', async () => {
      const api = await signIn();
      const scarce = await api.products.getBySlug('trail-gps-watch');
      let cart = await api.cart.add(scarce.id, 2);
      expect(cart.items[0]).toMatchObject({ qty: 2, lineTotal: scarce.price * 2 });
      cart = await api.cart.add(scarce.id, 3);
      expect(cart.items[0]?.qty).toBe(5);
      await expectApiError(api.cart.add(scarce.id, scarce.stock), 409, 'INSUFFICIENT_STOCK');
      cart = await api.cart.update(scarce.id, 1);
      expect(cart.itemCount).toBe(1);
      cart = await api.cart.update(scarce.id, 0);
      expect(cart.items).toHaveLength(0);
    });

    it('keeps carts separate per user', async () => {
      const api = await signIn();
      const product = await api.products.getBySlug('cork-yoga-mat');
      await api.cart.add(product.id, 1);
      await signIn(api, admin);
      expect((await api.cart.get()).items).toHaveLength(0);
    });
  });

  describe('orders', () => {
    it('creates an order from the cart, decrements stock and clears the cart', async () => {
      const api = await signIn();
      const mat = await api.products.getBySlug('cork-yoga-mat');
      await api.cart.add(mat.id, 2);
      const order = await api.orders.create({ shippingAddress: address });
      expect(order.status).toBe('placed');
      expect(order.payment).toEqual({ provider: 'mock', status: 'pending' });
      expect(order.items[0]).toMatchObject({ slug: 'cork-yoga-mat', qty: 2, price: mat.price });
      expect(order.totals.subtotal).toBe(mat.price * 2);
      expect((await api.products.getBySlug('cork-yoga-mat')).stock).toBe(mat.stock - 2);
      expect((await api.cart.get()).items).toHaveLength(0);
      expect(await api.orders.listMine()).toHaveLength(1);
    });

    it('refuses an empty cart and insufficient stock at order time', async () => {
      const api = await signIn();
      await expectApiError(api.orders.create({ shippingAddress: address }), 400, 'BAD_REQUEST');
      const watch = await api.products.getBySlug('trail-gps-watch');
      await api.cart.add(watch.id, watch.stock);
      await signIn(api, admin);
      await api.products.update(watch.id, { stock: 1 });
      await signIn(api);
      await expectApiError(
        api.orders.create({ shippingAddress: address }),
        409,
        'INSUFFICIENT_STOCK',
      );
    });

    it('pays once, refuses double payment and cancels with a refund and stock release', async () => {
      const api = await signIn();
      const pen = await api.products.getBySlug('brass-fountain-pen');
      await api.cart.add(pen.id, 1);
      const order = await api.orders.create({ shippingAddress: address });
      const paid = await api.orders.pay(order.id, { cardLast4: '4242' });
      expect(paid.status).toBe('paid');
      expect(paid.payment.reference).toMatch(/^MOCK-/);
      await expectApiError(api.orders.pay(order.id), 409, 'ALREADY_PAID');
      const cancelled = await api.orders.cancel(order.id);
      expect(cancelled.status).toBe('cancelled');
      expect(cancelled.payment.status).toBe('refunded');
      expect(cancelled.statusHistory.map((h) => h.status)).toEqual(['placed', 'paid', 'cancelled']);
      expect((await api.products.getBySlug('brass-fountain-pen')).stock).toBe(pen.stock);
    });

    it('hides other users orders', async () => {
      const api = await signIn();
      const pen = await api.products.getBySlug('brass-fountain-pen');
      await api.cart.add(pen.id, 1);
      const order = await api.orders.create({ shippingAddress: address });
      await signIn(api, admin);
      await expectApiError(api.orders.getMine(order.id), 404, 'NOT_FOUND');
    });
  });

  describe('admin', () => {
    it('forbids shoppers from admin operations', async () => {
      const api = await signIn();
      await expectApiError(api.orders.adminList(), 403, 'FORBIDDEN');
      await expectApiError(api.products.remove('p-cork-yoga-mat'), 403, 'FORBIDDEN');
      await expectApiError(api.categories.create({ name: 'Garden' }), 403, 'FORBIDDEN');
    });

    it('lets an admin create, update and delete products with unique slugs', async () => {
      const api = await signIn(undefined, admin);
      const categories = await api.categories.list();
      const input = {
        name: 'Field Notes Pack',
        description: 'Three pocket notebooks with graph paper.',
        price: 49900,
        category: categories[0]!.id,
        stock: 5,
      };
      const created = await api.products.create(input);
      expect(created.slug).toBe('field-notes-pack');
      const second = await api.products.create(input);
      expect(second.slug).toBe('field-notes-pack-2');
      const updated = await api.products.update(created.id, { stock: 9, featured: true });
      expect(updated).toMatchObject({ stock: 9, featured: true });
      await api.products.remove(created.id);
      await expectApiError(api.products.getBySlug('field-notes-pack'), 404, 'NOT_FOUND');
      await expectApiError(
        api.products.create({ ...input, category: 'c-missing' }),
        400,
        'BAD_REQUEST',
      );
    });

    it('lists all orders with the customer and enforces status transitions', async () => {
      const api = await signIn();
      const pen = await api.products.getBySlug('brass-fountain-pen');
      await api.cart.add(pen.id, 1);
      const order = await api.orders.create({ shippingAddress: address });

      await signIn(api, admin);
      const list = await api.orders.adminList();
      expect(list.total).toBe(1);
      expect(list.items[0]?.user).toMatchObject({ email: shopper.email });

      await expectApiError(
        api.orders.adminUpdateStatus(order.id, 'delivered'),
        409,
        'INVALID_STATUS_TRANSITION',
      );
      for (const status of ['paid', 'shipped', 'delivered'] as const) {
        expect((await api.orders.adminUpdateStatus(order.id, status)).status).toBe(status);
      }
      expect((await api.orders.adminList({ status: 'delivered' })).total).toBe(1);
    });
  });
});
