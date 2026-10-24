import { ApiError, ORDER_TRANSITIONS } from '../types';
import type {
  ApiClient,
  Cart,
  CartItem,
  Category,
  CategoryInput,
  Order,
  OrderListParams,
  OrderStatus,
  Paginated,
  Product,
  ProductInput,
  ProductListParams,
  ProductSort,
  User,
} from '../types';
import { getToken, setToken } from '../session';
import { computeTotals } from '@/lib/pricing';
import { DEMO_STORAGE_KEY, clearState, hashDemoPassword, loadState, saveState } from './demo-store';
import type { DemoCartLine, DemoState, DemoUser } from './demo-store';

export interface DemoClientOptions {
  storageKey?: string;
  /** Simulated latency in ms; a function is called per request. */
  latency?: number | (() => number);
}

export interface DemoApiClient extends ApiClient {
  reset(): void;
}

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const randomId = (prefix: string): string =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

const escapeRegex = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const SORTERS: Record<ProductSort, (a: Product, b: Product) => number> = {
  newest: (a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
  price_asc: (a, b) => a.price - b.price || a.id.localeCompare(b.id),
  price_desc: (a, b) => b.price - a.price || a.id.localeCompare(b.id),
  rating: (a, b) => b.rating.average - a.rating.average || b.rating.count - a.rating.count,
  name: (a, b) => a.name.localeCompare(b.name),
};

function validation(issues: Array<{ path: string; message: string }>): ApiError {
  return new ApiError(400, {
    code: 'VALIDATION_ERROR',
    message: 'Request validation failed',
    details: issues,
  });
}

const notFound = (what: string): ApiError =>
  new ApiError(404, { code: 'NOT_FOUND', message: `${what} not found` });

const insufficientStock = (product: Product, requested: number): ApiError =>
  new ApiError(409, {
    code: 'INSUFFICIENT_STOCK',
    message: `Only ${product.stock} of "${product.name}" available`,
    details: { productId: product.id, requested, available: product.stock },
  });

function paginate<T>(items: T[], page: number, limit: number): Paginated<T> {
  const start = (page - 1) * limit;
  return {
    items: items.slice(start, start + limit),
    page,
    limit,
    total: items.length,
    totalPages: Math.ceil(items.length / limit),
  };
}

const publicUser = ({ passwordHash: _hash, ...user }: DemoUser): User => user;

// Reads return copies so callers can never mutate the store by accident, like a real API.
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function createDemoClient(options: DemoClientOptions = {}): DemoApiClient {
  const storageKey = options.storageKey ?? DEMO_STORAGE_KEY;
  let state: DemoState = loadState(storageKey);

  const persist = () => saveState(state, storageKey);

  const latencyFor = (): number => {
    if (typeof options.latency === 'function') return options.latency();
    if (typeof options.latency === 'number') return options.latency;
    return import.meta.env.MODE === 'test' ? 0 : 160 + Math.random() * 240;
  };

  const wait = (): Promise<void> => {
    const ms = latencyFor();
    return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
  };

  function currentUser(): DemoUser {
    const token = getToken();
    const userId = token ? state.sessions[token] : undefined;
    const user = userId ? state.users.find((u) => u.id === userId) : undefined;
    if (!user) {
      if (token) setToken(null);
      throw new ApiError(401, { code: 'UNAUTHORIZED', message: 'Authentication required' });
    }
    return user;
  }

  function requireAdmin(): DemoUser {
    const user = currentUser();
    if (user.role !== 'admin') {
      throw new ApiError(403, { code: 'FORBIDDEN', message: 'Admin access required' });
    }
    return user;
  }

  function issueToken(user: DemoUser): string {
    const token = `demo.${randomId('t')}`;
    state.sessions[token] = user.id;
    persist();
    return token;
  }

  const findProduct = (id: string): Product | undefined => state.products.find((p) => p.id === id);

  function cartLines(userId: string): DemoCartLine[] {
    const lines = state.carts[userId] ?? [];
    // Drop lines for products an admin has since deleted.
    const live = lines.filter((line) => findProduct(line.productId));
    state.carts[userId] = live;
    return live;
  }

  function serializeCart(userId: string): Cart {
    const items: CartItem[] = cartLines(userId).map((line) => {
      const product = findProduct(line.productId) as Product;
      return {
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          currency: product.currency,
          images: product.images,
          stock: product.stock,
        },
        qty: line.qty,
        lineTotal: product.price * line.qty,
      };
    });
    return {
      id: `cart-${userId}`,
      items,
      itemCount: items.reduce((sum, i) => sum + i.qty, 0),
      totals: computeTotals(items.map((i) => ({ price: i.product.price, qty: i.qty }))),
    };
  }

  function pushStatus(order: Order, status: OrderStatus): void {
    order.status = status;
    order.statusHistory.push({ status, at: new Date().toISOString() });
    order.updatedAt = new Date().toISOString();
  }

  function assertTransition(order: Order, next: OrderStatus): void {
    const allowed = ORDER_TRANSITIONS[order.status];
    if (!allowed.includes(next)) {
      throw new ApiError(409, {
        code: 'INVALID_STATUS_TRANSITION',
        message: `Cannot move an order from "${order.status}" to "${next}"`,
        details: { from: order.status, to: next, allowed },
      });
    }
  }

  function releaseStock(order: Order): void {
    for (const item of order.items) {
      const product = findProduct(item.product);
      if (product) product.stock += item.qty;
    }
  }

  function ownOrder(id: string, userId: string): Order {
    const order = state.orders.find((o) => o.id === id && o.user === userId);
    if (!order) throw notFound('Order');
    return order;
  }

  const withUser = (order: Order): Order => {
    const user = state.users.find((u) => u.id === order.user);
    return {
      ...order,
      user: user ? { id: user.id, name: user.name, email: user.email } : order.user,
    };
  };

  const client: DemoApiClient = {
    mode: 'demo',

    reset() {
      clearState(storageKey);
      state = loadState(storageKey);
      setToken(null);
    },

    auth: {
      async register(input) {
        await wait();
        const issues: Array<{ path: string; message: string }> = [];
        const name = input.name?.trim() ?? '';
        const email = input.email?.trim().toLowerCase() ?? '';
        if (name.length < 2)
          issues.push({ path: 'name', message: 'Name must be at least 2 characters' });
        if (!EMAIL_RX.test(email))
          issues.push({ path: 'email', message: 'Enter a valid email address' });
        if ((input.password ?? '').length < 8) {
          issues.push({ path: 'password', message: 'Password must be at least 8 characters' });
        }
        if (issues.length) throw validation(issues);
        if (state.users.some((u) => u.email === email)) {
          throw new ApiError(409, {
            code: 'EMAIL_TAKEN',
            message: 'An account with that email already exists',
          });
        }
        const user: DemoUser = {
          id: randomId('u'),
          name,
          email,
          role: 'user',
          passwordHash: hashDemoPassword(input.password),
          createdAt: new Date().toISOString(),
        };
        state.users.push(user);
        return { user: publicUser(user), token: issueToken(user) };
      },

      async login(input) {
        await wait();
        const email = input.email?.trim().toLowerCase() ?? '';
        const user = state.users.find((u) => u.email === email);
        if (!user || user.passwordHash !== hashDemoPassword(input.password ?? '')) {
          throw new ApiError(401, {
            code: 'INVALID_CREDENTIALS',
            message: 'Incorrect email or password',
          });
        }
        return { user: publicUser(user), token: issueToken(user) };
      },

      async me() {
        await wait();
        return publicUser(currentUser());
      },

      async updateProfile(input) {
        await wait();
        const user = currentUser();
        if (input.name !== undefined) user.name = input.name.trim();
        if (input.phone !== undefined) user.phone = input.phone.trim();
        if (input.address !== undefined) user.address = input.address.trim();
        persist();
        return publicUser(user);
      },
    },

    categories: {
      async list() {
        await wait();
        return [...state.categories]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((c) => ({
            ...c,
            productCount: state.products.filter((p) => p.category.id === c.id).length,
          }));
      },
      async create(input: CategoryInput) {
        await wait();
        requireAdmin();
        const slug = input.slug ?? slugify(input.name);
        if (state.categories.some((c) => c.slug === slug)) {
          throw new ApiError(409, {
            code: 'SLUG_TAKEN',
            message: `A category with slug "${slug}" already exists`,
          });
        }
        const category: Category = {
          id: `c-${slug}`,
          name: input.name.trim(),
          slug,
          description: input.description ?? '',
          image: input.image ?? '',
        };
        state.categories.push(category);
        persist();
        return clone(category);
      },
      async update(id, input) {
        await wait();
        requireAdmin();
        const category = state.categories.find((c) => c.id === id);
        if (!category) throw notFound('Category');
        Object.assign(category, input);
        persist();
        return clone(category);
      },
      async remove(id) {
        await wait();
        requireAdmin();
        const inUse = state.products.filter((p) => p.category.id === id).length;
        if (inUse > 0) {
          throw new ApiError(409, {
            code: 'CATEGORY_IN_USE',
            message: 'Move or delete its products before removing this category',
            details: { productCount: inUse },
          });
        }
        if (!state.categories.some((c) => c.id === id)) throw notFound('Category');
        state.categories = state.categories.filter((c) => c.id !== id);
        persist();
      },
    },

    products: {
      async list(params: ProductListParams = {}) {
        await wait();
        const page = Math.max(1, params.page ?? 1);
        const limit = Math.min(100, Math.max(1, params.limit ?? 12));
        if (
          params.minPrice !== undefined &&
          params.maxPrice !== undefined &&
          params.minPrice > params.maxPrice
        ) {
          throw validation([
            { path: 'minPrice', message: 'minPrice must be less than or equal to maxPrice' },
          ]);
        }
        let items = [...state.products];
        if (params.q) {
          const rx = new RegExp(escapeRegex(params.q.trim()), 'i');
          items = items.filter(
            (p) => rx.test(p.name) || rx.test(p.description) || p.tags.some((t) => rx.test(t)),
          );
        }
        if (params.category) items = items.filter((p) => p.category.slug === params.category);
        if (params.tag) items = items.filter((p) => p.tags.includes(params.tag as string));
        if (params.featured !== undefined)
          items = items.filter((p) => p.featured === params.featured);
        if (params.minPrice !== undefined)
          items = items.filter((p) => p.price >= (params.minPrice as number));
        if (params.maxPrice !== undefined)
          items = items.filter((p) => p.price <= (params.maxPrice as number));
        items.sort(SORTERS[params.sort ?? 'newest']);
        return clone(paginate(items, page, limit));
      },

      async getBySlug(slug) {
        await wait();
        const product = state.products.find((p) => p.slug === slug);
        if (!product) throw notFound('Product');
        return clone(product);
      },

      async create(input: ProductInput) {
        await wait();
        requireAdmin();
        const category = state.categories.find((c) => c.id === input.category);
        if (!category) {
          throw new ApiError(400, {
            code: 'BAD_REQUEST',
            message: 'Category does not exist',
            details: [{ path: 'category', message: 'Unknown category' }],
          });
        }
        if (!Number.isInteger(input.price) || input.price < 0) {
          throw validation([{ path: 'price', message: 'Price must be an integer in minor units' }]);
        }
        const base = input.slug ?? slugify(input.name);
        let slug = base;
        for (let n = 2; state.products.some((p) => p.slug === slug); n += 1) slug = `${base}-${n}`;
        const product: Product = {
          id: randomId('p'),
          name: input.name.trim(),
          slug,
          description: input.description.trim(),
          price: input.price,
          currency: input.currency ?? 'INR',
          images: input.images ?? [],
          category: { id: category.id, name: category.name, slug: category.slug },
          stock: input.stock,
          rating: { average: 0, count: 0 },
          tags: input.tags ?? [],
          featured: input.featured ?? false,
          createdAt: new Date().toISOString(),
        };
        state.products.unshift(product);
        persist();
        return clone(product);
      },

      async update(id, input) {
        await wait();
        requireAdmin();
        const product = findProduct(id);
        if (!product) throw notFound('Product');
        const { category: categoryId, ...rest } = input;
        if (categoryId) {
          const category = state.categories.find((c) => c.id === categoryId);
          if (!category) {
            throw new ApiError(400, {
              code: 'BAD_REQUEST',
              message: 'Category does not exist',
              details: [{ path: 'category', message: 'Unknown category' }],
            });
          }
          product.category = { id: category.id, name: category.name, slug: category.slug };
        }
        Object.assign(product, rest);
        persist();
        return clone(product);
      },

      async remove(id) {
        await wait();
        requireAdmin();
        if (!findProduct(id)) throw notFound('Product');
        state.products = state.products.filter((p) => p.id !== id);
        persist();
      },
    },

    cart: {
      async get() {
        await wait();
        return serializeCart(currentUser().id);
      },
      async add(productId, qty) {
        await wait();
        const user = currentUser();
        const product = findProduct(productId);
        if (!product) throw notFound('Product');
        const lines = cartLines(user.id);
        const existing = lines.find((l) => l.productId === productId);
        const nextQty = (existing?.qty ?? 0) + qty;
        if (nextQty > product.stock) throw insufficientStock(product, nextQty);
        if (existing) existing.qty = nextQty;
        else lines.push({ productId, qty });
        persist();
        return serializeCart(user.id);
      },
      async update(productId, qty) {
        await wait();
        const user = currentUser();
        const lines = cartLines(user.id);
        const existing = lines.find((l) => l.productId === productId);
        if (!existing) throw notFound('Cart item');
        if (qty <= 0) {
          state.carts[user.id] = lines.filter((l) => l.productId !== productId);
        } else {
          const product = findProduct(productId);
          if (!product) throw notFound('Product');
          if (qty > product.stock) throw insufficientStock(product, qty);
          existing.qty = qty;
        }
        persist();
        return serializeCart(user.id);
      },
      async remove(productId) {
        await wait();
        const user = currentUser();
        state.carts[user.id] = cartLines(user.id).filter((l) => l.productId !== productId);
        persist();
        return serializeCart(user.id);
      },
      async clear() {
        await wait();
        const user = currentUser();
        state.carts[user.id] = [];
        persist();
        return serializeCart(user.id);
      },
    },

    orders: {
      async create(input) {
        await wait();
        const user = currentUser();
        const lines = cartLines(user.id);
        if (lines.length === 0) {
          throw new ApiError(400, { code: 'BAD_REQUEST', message: 'Your cart is empty' });
        }
        for (const line of lines) {
          const product = findProduct(line.productId) as Product;
          if (line.qty > product.stock) throw insufficientStock(product, line.qty);
        }
        const items = lines.map((line) => {
          const product = findProduct(line.productId) as Product;
          product.stock -= line.qty;
          return {
            product: product.id,
            name: product.name,
            slug: product.slug,
            image: product.images[0] ?? '',
            price: product.price,
            currency: product.currency,
            qty: line.qty,
          };
        });
        const now = new Date().toISOString();
        const order: Order = {
          id: randomId('o'),
          user: user.id,
          items,
          totals: computeTotals(items),
          currency: items[0]?.currency ?? 'INR',
          shippingAddress: input.shippingAddress,
          status: 'placed',
          statusHistory: [{ status: 'placed', at: now }],
          payment: { provider: 'mock', status: 'pending' },
          createdAt: now,
          updatedAt: now,
        };
        state.orders.unshift(order);
        state.carts[user.id] = [];
        persist();
        return clone(order);
      },

      async pay(id) {
        await wait();
        const order = ownOrder(id, currentUser().id);
        if (order.status !== 'placed') {
          throw new ApiError(409, {
            code: 'ALREADY_PAID',
            message: 'This order is not awaiting payment',
          });
        }
        order.payment = {
          provider: 'mock',
          status: 'paid',
          reference: `MOCK-${Math.random().toString(16).slice(2, 10).toUpperCase()}`,
          paidAt: new Date().toISOString(),
        };
        pushStatus(order, 'paid');
        persist();
        return clone(order);
      },

      async cancel(id) {
        await wait();
        const order = ownOrder(id, currentUser().id);
        assertTransition(order, 'cancelled');
        releaseStock(order);
        if (order.payment.status === 'paid') order.payment.status = 'refunded';
        pushStatus(order, 'cancelled');
        persist();
        return clone(order);
      },

      async listMine() {
        await wait();
        const user = currentUser();
        return clone(state.orders.filter((o) => o.user === user.id));
      },

      async getMine(id) {
        await wait();
        return clone(ownOrder(id, currentUser().id));
      },

      async adminList(params: OrderListParams = {}) {
        await wait();
        requireAdmin();
        const page = Math.max(1, params.page ?? 1);
        const limit = Math.min(100, Math.max(1, params.limit ?? 12));
        const items = state.orders.filter((o) => !params.status || o.status === params.status);
        return paginate(items.map(withUser), page, limit);
      },

      async adminUpdateStatus(id, status) {
        await wait();
        requireAdmin();
        const order = state.orders.find((o) => o.id === id);
        if (!order) throw notFound('Order');
        assertTransition(order, status);
        if (status === 'cancelled') {
          releaseStock(order);
          if (order.payment.status === 'paid') order.payment.status = 'refunded';
        }
        if (status === 'paid' && order.payment.status === 'pending') {
          order.payment = {
            provider: 'mock',
            status: 'paid',
            reference: `ADMIN-${Math.random().toString(16).slice(2, 10).toUpperCase()}`,
            paidAt: new Date().toISOString(),
          };
        }
        pushStatus(order, status);
        persist();
        return withUser(order);
      },
    },
  };

  return client;
}
