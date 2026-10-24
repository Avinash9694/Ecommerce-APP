import { beforeEach, describe, expect, it } from 'vitest';
import { api, seedCatalog } from './helpers.js';

let products;

beforeEach(async () => {
  ({ products } = await seedCatalog());
});

describe('GET /api/v1/products', () => {
  it('paginates with sensible defaults', async () => {
    const res = await api().get('/api/v1/products');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ page: 1, limit: 12, total: 24, totalPages: 2 });
    expect(res.body.items).toHaveLength(12);
    expect(res.body.items[0].category).toMatchObject({
      name: expect.any(String),
      slug: expect.any(String),
    });
  });

  it('honours page and limit', async () => {
    const res = await api().get('/api/v1/products?page=3&limit=10');
    expect(res.body.items).toHaveLength(4);
    expect(res.body).toMatchObject({ page: 3, limit: 10, totalPages: 3 });
  });

  it('searches name, description and tags case-insensitively', async () => {
    const res = await api().get('/api/v1/products?q=BLUETOOTH');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    expect(res.body.items.every((p) => p.category.slug === 'audio')).toBe(true);
  });

  it('filters by category slug', async () => {
    const res = await api().get('/api/v1/products?category=fitness');
    expect(res.body.total).toBe(4);
    expect(res.body.items.every((p) => p.category.slug === 'fitness')).toBe(true);
  });

  it('returns an empty page for an unknown category', async () => {
    const res = await api().get('/api/v1/products?category=nope');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ items: [], total: 0, totalPages: 0 });
  });

  it('filters by a price range in minor units', async () => {
    const res = await api().get('/api/v1/products?minPrice=100000&maxPrice=200000&limit=50');
    expect(res.body.total).toBeGreaterThan(0);
    expect(res.body.items.every((p) => p.price >= 100000 && p.price <= 200000)).toBe(true);
  });

  it('rejects a price range where minPrice exceeds maxPrice', async () => {
    const res = await api().get('/api/v1/products?minPrice=5000&maxPrice=1000');
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].path).toBe('minPrice');
  });

  it('sorts by price ascending and descending', async () => {
    const asc = await api().get('/api/v1/products?sort=price_asc&limit=50');
    const prices = asc.body.items.map((p) => p.price);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));

    const desc = await api().get('/api/v1/products?sort=price_desc&limit=50');
    const descPrices = desc.body.items.map((p) => p.price);
    expect(descPrices).toEqual([...prices].reverse());
  });

  it('sorts by rating with the best rated first', async () => {
    const res = await api().get('/api/v1/products?sort=rating&limit=3');
    const ratings = res.body.items.map((p) => p.rating.average);
    expect(ratings[0]).toBeGreaterThanOrEqual(ratings[1]);
    expect(ratings[1]).toBeGreaterThanOrEqual(ratings[2]);
  });

  it('rejects an unknown sort key', async () => {
    const res = await api().get('/api/v1/products?sort=cheapest');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('filters featured products and by tag', async () => {
    const featured = await api().get('/api/v1/products?featured=true&limit=50');
    expect(featured.body.total).toBe(6);
    expect(featured.body.items.every((p) => p.featured)).toBe(true);

    const tagged = await api().get('/api/v1/products?tag=gps');
    expect(tagged.body.total).toBe(2);
  });

  it('combines search with a category filter', async () => {
    const res = await api().get('/api/v1/products?q=watch&category=wearables');
    expect(res.body.total).toBe(2);
  });
});

describe('GET /api/v1/products/:slug', () => {
  it('returns a product by slug with its category populated', async () => {
    const res = await api().get(`/api/v1/products/${products[0].slug}`);
    expect(res.status).toBe(200);
    expect(res.body.product).toMatchObject({ slug: products[0].slug, name: products[0].name });
    expect(res.body.product.category.slug).toEqual(expect.any(String));
    expect(res.body.product.images).toHaveLength(2);
  });

  it('returns 404 for an unknown slug', async () => {
    const res = await api().get('/api/v1/products/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error).toEqual({ code: 'NOT_FOUND', message: 'Product not found' });
  });
});
