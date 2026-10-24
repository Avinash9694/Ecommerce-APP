import { ApiError } from './types';
import type {
  ApiClient,
  ApiErrorShape,
  Cart,
  Category,
  Order,
  Paginated,
  Product,
  User,
} from './types';
import { getToken, setToken } from './session';

type Query = Record<string, string | number | boolean | undefined>;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Query;
}

function buildUrl(base: string, path: string, query?: Query): string {
  const url = new URL(`${base}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  }
  return url.toString();
}

export function createHttpClient(apiOrigin: string): ApiClient {
  const base = `${apiOrigin.replace(/\/$/, '')}/api/v1`;

  async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';

    let response: Response;
    try {
      response = await fetch(buildUrl(base, path, options.query), {
        method: options.method ?? 'GET',
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      });
    } catch {
      throw new ApiError(0, { code: 'NETWORK_ERROR', message: 'Could not reach the server' });
    }

    if (response.status === 204) return undefined as T;

    const text = await response.text();
    let payload: unknown = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = null;
      }
    }

    if (!response.ok) {
      const shape = (payload as { error?: ApiErrorShape } | null)?.error ?? {
        code: 'HTTP_ERROR',
        message: `Request failed with status ${response.status}`,
      };
      if (response.status === 401 && token) setToken(null);
      throw new ApiError(response.status, shape);
    }
    return payload as T;
  }

  return {
    mode: 'http',
    auth: {
      register: (input) => request('/auth/register', { method: 'POST', body: input }),
      login: (input) => request('/auth/login', { method: 'POST', body: input }),
      me: () => request<{ user: User }>('/auth/me').then((r) => r.user),
      updateProfile: (input) =>
        request<{ user: User }>('/auth/me', { method: 'PATCH', body: input }).then((r) => r.user),
    },
    categories: {
      list: () => request<{ items: Category[] }>('/categories').then((r) => r.items),
      create: (input) =>
        request<{ category: Category }>('/categories', { method: 'POST', body: input }).then(
          (r) => r.category,
        ),
      update: (id, input) =>
        request<{ category: Category }>(`/categories/${id}`, { method: 'PATCH', body: input }).then(
          (r) => r.category,
        ),
      remove: (id) => request<void>(`/categories/${id}`, { method: 'DELETE' }),
    },
    products: {
      list: (params = {}) => request<Paginated<Product>>('/products', { query: { ...params } }),
      getBySlug: (slug) =>
        request<{ product: Product }>(`/products/${encodeURIComponent(slug)}`).then(
          (r) => r.product,
        ),
      create: (input) =>
        request<{ product: Product }>('/products', { method: 'POST', body: input }).then(
          (r) => r.product,
        ),
      update: (id, input) =>
        request<{ product: Product }>(`/products/${id}`, { method: 'PATCH', body: input }).then(
          (r) => r.product,
        ),
      remove: (id) => request<void>(`/products/${id}`, { method: 'DELETE' }),
    },
    cart: {
      get: () => request<{ cart: Cart }>('/cart').then((r) => r.cart),
      add: (productId, qty) =>
        request<{ cart: Cart }>('/cart/items', { method: 'POST', body: { productId, qty } }).then(
          (r) => r.cart,
        ),
      update: (productId, qty) =>
        request<{ cart: Cart }>(`/cart/items/${productId}`, {
          method: 'PATCH',
          body: { qty },
        }).then((r) => r.cart),
      remove: (productId) =>
        request<{ cart: Cart }>(`/cart/items/${productId}`, { method: 'DELETE' }).then(
          (r) => r.cart,
        ),
      clear: () => request<{ cart: Cart }>('/cart', { method: 'DELETE' }).then((r) => r.cart),
    },
    orders: {
      create: (input) =>
        request<{ order: Order }>('/orders', { method: 'POST', body: input }).then((r) => r.order),
      pay: (id, input = {}) =>
        request<{ order: Order }>(`/orders/mine/${id}/pay`, { method: 'POST', body: input }).then(
          (r) => r.order,
        ),
      cancel: (id) =>
        request<{ order: Order }>(`/orders/mine/${id}/cancel`, { method: 'POST' }).then(
          (r) => r.order,
        ),
      listMine: () => request<{ items: Order[] }>('/orders/mine').then((r) => r.items),
      getMine: (id) => request<{ order: Order }>(`/orders/mine/${id}`).then((r) => r.order),
      adminList: (params = {}) => request<Paginated<Order>>('/orders', { query: { ...params } }),
      adminUpdateStatus: (id, status) =>
        request<{ order: Order }>(`/orders/${id}/status`, {
          method: 'PATCH',
          body: { status },
        }).then((r) => r.order),
    },
  };
}
