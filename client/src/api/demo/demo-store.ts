import type { Category, Order, Product, User } from '../types';
import { readJson, removeStorage, writeStorage } from '@/lib/storage';
import { buildCategories, buildProducts } from './demo-catalog';

export const DEMO_STORAGE_KEY = 'shop.demo.v1';
const STATE_VERSION = 1;

export interface DemoUser extends User {
  passwordHash: string;
}

export interface DemoCartLine {
  productId: string;
  qty: number;
}

export interface DemoState {
  version: number;
  users: DemoUser[];
  /** token -> userId */
  sessions: Record<string, string>;
  categories: Category[];
  products: Product[];
  carts: Record<string, DemoCartLine[]>;
  orders: Order[];
}

export interface DemoAccount {
  label: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
}

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  { label: 'Shopper', email: 'demo@shop.test', password: 'demo1234', role: 'user' },
  { label: 'Admin', email: 'admin@shop.test', password: 'admin1234', role: 'admin' },
];

// Demo data lives in the visitor's own browser, so this only keeps passwords out of
// plain sight in devtools; it is not a security measure.
export function hashDemoPassword(password: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < password.length; i += 1) {
    hash ^= password.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `d_${hash.toString(16).padStart(8, '0')}`;
}

export function createInitialState(now = Date.UTC(2026, 0, 1)): DemoState {
  const users: DemoUser[] = [
    {
      id: 'u-demo',
      name: 'Demo Shopper',
      email: 'demo@shop.test',
      role: 'user',
      phone: '+91 98765 43210',
      address: '12 Jubilee Hills Road, Hyderabad 500033',
      passwordHash: hashDemoPassword('demo1234'),
      createdAt: new Date(now).toISOString(),
    },
    {
      id: 'u-admin',
      name: 'Store Admin',
      email: 'admin@shop.test',
      role: 'admin',
      passwordHash: hashDemoPassword('admin1234'),
      createdAt: new Date(now).toISOString(),
    },
  ];
  return {
    version: STATE_VERSION,
    users,
    sessions: {},
    categories: buildCategories(),
    products: buildProducts(now),
    carts: {},
    orders: [],
  };
}

export function loadState(storageKey = DEMO_STORAGE_KEY): DemoState {
  const stored = readJson<Partial<DemoState> | null>(storageKey, null);
  if (!stored || stored.version !== STATE_VERSION || !Array.isArray(stored.products)) {
    return createInitialState();
  }
  return stored as DemoState;
}

export function saveState(state: DemoState, storageKey = DEMO_STORAGE_KEY): void {
  writeStorage(storageKey, JSON.stringify(state));
}

export function clearState(storageKey = DEMO_STORAGE_KEY): void {
  removeStorage(storageKey);
}
