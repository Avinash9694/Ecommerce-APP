import { readFile } from 'node:fs/promises';
import { config } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { Category } from '../models/category.js';
import { Product } from '../models/product.js';
import { User } from '../models/user.js';
import { Cart } from '../models/cart.js';
import { Order } from '../models/order.js';
import { hashPassword } from '../utils/password.js';

const catalog = JSON.parse(await readFile(new URL('./catalog.json', import.meta.url), 'utf8'));

export const SEED_ACCOUNTS = [
  { name: 'Demo Shopper', email: 'demo@shop.test', password: 'demo1234', role: 'user' },
  { name: 'Store Admin', email: 'admin@shop.test', password: 'admin1234', role: 'admin' },
];

export const productImages = (slug) => [`products/${slug}-1.svg`, `products/${slug}-2.svg`];

export async function seedDatabase({ accounts = SEED_ACCOUNTS } = {}) {
  await Promise.all([
    Category.deleteMany({}),
    Product.deleteMany({}),
    Cart.deleteMany({}),
    Order.deleteMany({}),
  ]);

  const categories = await Category.insertMany(catalog.categories);
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c._id]));

  const products = await Product.insertMany(
    catalog.products.map((p) => ({
      ...p,
      category: categoryBySlug.get(p.category),
      images: productImages(p.slug),
    })),
  );

  for (const account of accounts) {
    const passwordHash = await hashPassword(account.password);
    await User.findOneAndUpdate(
      { email: account.email },
      { name: account.name, role: account.role, passwordHash },
      { upsert: true },
    );
  }

  return { categories: categories.length, products: products.length, accounts: accounts.length };
}

const isDirectRun =
  process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (isDirectRun) {
  await connectDB(config.mongoUri);
  const result = await seedDatabase();
  console.info(
    `Seeded ${result.categories} categories, ${result.products} products, ${result.accounts} accounts`,
  );
  await disconnectDB();
}
