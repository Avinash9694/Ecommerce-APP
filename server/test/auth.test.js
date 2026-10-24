import { describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import { api, bearer, createUser } from './helpers.js';

const validBody = { name: 'Asha Rao', email: 'asha@shop.test', password: 'supersecret1' };

describe('POST /api/v1/auth/register', () => {
  it('creates an account and returns a token without the password hash', async () => {
    const res = await api().post('/api/v1/auth/register').send(validBody);
    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({
      name: 'Asha Rao',
      email: 'asha@shop.test',
      role: 'user',
    });
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.user.id).toEqual(expect.any(String));
  });

  it('returns 400 with field-level details for an invalid body', async () => {
    const res = await api()
      .post('/api/v1/auth/register')
      .send({ name: 'A', email: 'not-an-email', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    const paths = res.body.error.details.map((d) => d.path);
    expect(paths).toEqual(expect.arrayContaining(['name', 'email', 'password']));
  });

  it('returns 409 when the email is already registered', async () => {
    await api().post('/api/v1/auth/register').send(validBody);
    const res = await api().post('/api/v1/auth/register').send(validBody);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('normalises the email to lowercase', async () => {
    const res = await api()
      .post('/api/v1/auth/register')
      .send({ ...validBody, email: 'Asha@Shop.TEST' });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('asha@shop.test');
  });
});

describe('POST /api/v1/auth/login', () => {
  it('returns 200 with a token for correct credentials', async () => {
    const { user, password } = await createUser();
    const res = await api().post('/api/v1/auth/login').send({ email: user.email, password });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.email).toBe(user.email);
  });

  it('returns 401 for a wrong password', async () => {
    const { user } = await createUser();
    const res = await api()
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: 'wrong-pass' });
    expect(res.status).toBe(401);
    expect(res.body.error).toEqual({
      code: 'INVALID_CREDENTIALS',
      message: 'Incorrect email or password',
    });
  });

  it('returns the same 401 for an unknown email so accounts cannot be enumerated', async () => {
    const res = await api()
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@shop.test', password: 'whatever1' });
    expect(res.status).toBe(401);
    expect(res.body.error).toEqual({
      code: 'INVALID_CREDENTIALS',
      message: 'Incorrect email or password',
    });
  });

  it('returns 400 when the password is missing', async () => {
    const res = await api().post('/api/v1/auth/login').send({ email: 'asha@shop.test' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/v1/auth/me', () => {
  it('returns 401 without a token', async () => {
    const res = await api().get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 for a malformed token', async () => {
    const res = await api().get('/api/v1/auth/me').set(bearer('not.a.jwt'));
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid token');
  });

  it('returns 401 with a distinct message for an expired token', async () => {
    const { user } = await createUser();
    const expired = jwt.sign({ sub: String(user._id) }, 'test-secret', { expiresIn: -10 });
    const res = await api().get('/api/v1/auth/me').set(bearer(expired));
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Session expired');
  });

  it('returns the current user for a valid token', async () => {
    const { user, token } = await createUser();
    const res = await api().get('/api/v1/auth/me').set(bearer(token));
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(String(user._id));
  });

  it('updates the profile through PATCH /me', async () => {
    const { token } = await createUser();
    const res = await api()
      .patch('/api/v1/auth/me')
      .set(bearer(token))
      .send({ name: 'New Name', phone: '12345' });
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ name: 'New Name', phone: '12345' });
  });
});
