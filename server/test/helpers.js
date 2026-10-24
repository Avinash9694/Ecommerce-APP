import request from 'supertest';
import { createApp } from '../src/app.js';
import { User } from '../src/models/user.js';
import { Product } from '../src/models/product.js';
import { Category } from '../src/models/category.js';
import { hashPassword } from '../src/utils/password.js';
import { signToken } from '../src/utils/jwt.js';
import { seedDatabase } from '../src/seed/seed.js';

export const app = createApp();
export const api = () => request(app);

export async function createUser({
  role = 'user',
  email,
  name = 'Test User',
  password = 'password123',
} = {}) {
  const user = await User.create({
    name,
    email: email ?? `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}@shop.test`,
    role,
    passwordHash: await hashPassword(password),
  });
  return { user, token: signToken(user), password };
}

export const createAdmin = (overrides) => createUser({ role: 'admin', ...overrides });

export async function seedCatalog() {
  await seedDatabase({ accounts: [] });
  const [products, categories] = await Promise.all([
    Product.find().sort({ name: 1 }),
    Category.find().sort({ name: 1 }),
  ]);
  return { products, categories };
}

export const bearer = (token) => ({ Authorization: `Bearer ${token}` });

export const shippingAddress = {
  fullName: 'Asha Rao',
  line1: '12 Jubilee Hills Road',
  city: 'Hyderabad',
  state: 'Telangana',
  postalCode: '500033',
  country: 'India',
  phone: '+91 98765 43210',
};

export async function cartWith(token, lines) {
  let res;
  for (const { productId, qty } of lines) {
    res = await api().post('/api/v1/cart/items').set(bearer(token)).send({ productId, qty });
  }
  return res;
}
