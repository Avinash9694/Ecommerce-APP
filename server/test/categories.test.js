import { beforeEach, describe, expect, it } from 'vitest';
import { api, bearer, createAdmin, createUser, seedCatalog } from './helpers.js';

let categories;
let admin;

beforeEach(async () => {
  ({ categories } = await seedCatalog());
  admin = await createAdmin();
});

describe('categories', () => {
  it('lists categories alphabetically with product counts', async () => {
    const res = await api().get('/api/v1/categories');
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(6);
    expect(res.body.items[0].name).toBe('Audio');
    expect(res.body.items.every((c) => c.productCount === 4)).toBe(true);
  });

  it('returns 404 for an unknown category slug', async () => {
    const res = await api().get('/api/v1/categories/missing');
    expect(res.status).toBe(404);
  });

  it('requires authentication to create', async () => {
    const res = await api().post('/api/v1/categories').send({ name: 'Garden' });
    expect(res.status).toBe(401);
  });

  it('forbids a regular user from creating', async () => {
    const { token } = await createUser();
    const res = await api().post('/api/v1/categories').set(bearer(token)).send({ name: 'Garden' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('lets an admin create one, deriving the slug from the name', async () => {
    const res = await api()
      .post('/api/v1/categories')
      .set(bearer(admin.token))
      .send({ name: 'Garden & Outdoors' });
    expect(res.status).toBe(201);
    expect(res.body.category.slug).toBe('garden-outdoors');
  });

  it('rejects a duplicate slug with 409', async () => {
    const res = await api()
      .post('/api/v1/categories')
      .set(bearer(admin.token))
      .send({ name: 'Audio' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('SLUG_TAKEN');
  });

  it('refuses to delete a category that still has products', async () => {
    const res = await api()
      .delete(`/api/v1/categories/${categories[0].id}`)
      .set(bearer(admin.token));
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CATEGORY_IN_USE');
    expect(res.body.error.details.productCount).toBe(4);
  });

  it('deletes an empty category and updates it before that', async () => {
    const created = await api()
      .post('/api/v1/categories')
      .set(bearer(admin.token))
      .send({ name: 'Temp' });
    const id = created.body.category.id;

    const patched = await api()
      .patch(`/api/v1/categories/${id}`)
      .set(bearer(admin.token))
      .send({ description: 'Short lived' });
    expect(patched.body.category.description).toBe('Short lived');

    const deleted = await api().delete(`/api/v1/categories/${id}`).set(bearer(admin.token));
    expect(deleted.status).toBe(204);
  });

  it('returns 400 for a malformed id', async () => {
    const res = await api().delete('/api/v1/categories/not-an-id').set(bearer(admin.token));
    expect(res.status).toBe(400);
  });
});
