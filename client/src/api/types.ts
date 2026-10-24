export type Role = 'user' | 'admin';
export type ProductSort = 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'name';
export type OrderStatus = 'placed' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  address?: string;
  createdAt?: string;
}

export interface AuthResult {
  user: User;
  token: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ProfileInput {
  name?: string;
  phone?: string;
  address?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount?: number;
}

export interface CategoryInput {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
}

export interface ProductCategoryRef {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  /** Integer in minor units (paise for INR). */
  price: number;
  currency: string;
  images: string[];
  category: ProductCategoryRef;
  stock: number;
  rating: { average: number; count: number };
  tags: string[];
  featured: boolean;
  createdAt?: string;
}

export interface ProductInput {
  name: string;
  slug?: string;
  description: string;
  price: number;
  currency?: string;
  images?: string[];
  category: string;
  stock: number;
  tags?: string[];
  featured?: boolean;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  q?: string;
  category?: string;
  tag?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSort;
  featured?: boolean;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type CartProduct = Pick<
  Product,
  'id' | 'name' | 'slug' | 'price' | 'currency' | 'images' | 'stock'
>;

export interface CartItem {
  product: CartProduct;
  qty: number;
  lineTotal: number;
}

export interface Totals {
  subtotal: number;
  shipping: number;
  total: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  itemCount: number;
  totals: Totals;
}

export interface ShippingAddress {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface OrderItem {
  product: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  currency: string;
  qty: number;
}

export interface Order {
  id: string;
  user?: { id: string; name: string; email: string } | string;
  items: OrderItem[];
  totals: Totals;
  currency: string;
  shippingAddress: ShippingAddress;
  status: OrderStatus;
  statusHistory: Array<{ status: OrderStatus; at: string }>;
  payment: { provider: 'mock'; status: PaymentStatus; reference?: string; paidAt?: string };
  createdAt: string;
  updatedAt?: string;
}

export interface CreateOrderInput {
  shippingAddress: ShippingAddress;
}

export interface PayOrderInput {
  cardLast4?: string;
}

export interface OrderListParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
}

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export interface ApiErrorShape {
  code: string;
  message: string;
  details?: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;

  constructor(status: number, shape: ApiErrorShape) {
    super(shape.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = shape.code;
    this.details = shape.details;
  }
}

export const isApiError = (err: unknown): err is ApiError => err instanceof ApiError;

export function errorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (isApiError(err)) return err.message;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

/** Field-level validation issues as the server reports them. */
export function fieldErrors(err: unknown): Record<string, string> {
  if (!isApiError(err) || !Array.isArray(err.details)) return {};
  const out: Record<string, string> = {};
  for (const issue of err.details as Array<{ path?: string; message?: string }>) {
    if (issue.path && issue.message && !out[issue.path]) out[issue.path] = issue.message;
  }
  return out;
}

export interface ApiClient {
  readonly mode: 'http' | 'demo';
  auth: {
    register(input: RegisterInput): Promise<AuthResult>;
    login(input: LoginInput): Promise<AuthResult>;
    me(): Promise<User>;
    updateProfile(input: ProfileInput): Promise<User>;
  };
  categories: {
    list(): Promise<Category[]>;
    create(input: CategoryInput): Promise<Category>;
    update(id: string, input: Partial<CategoryInput>): Promise<Category>;
    remove(id: string): Promise<void>;
  };
  products: {
    list(params?: ProductListParams): Promise<Paginated<Product>>;
    getBySlug(slug: string): Promise<Product>;
    create(input: ProductInput): Promise<Product>;
    update(id: string, input: Partial<ProductInput>): Promise<Product>;
    remove(id: string): Promise<void>;
  };
  cart: {
    get(): Promise<Cart>;
    add(productId: string, qty: number): Promise<Cart>;
    update(productId: string, qty: number): Promise<Cart>;
    remove(productId: string): Promise<Cart>;
    clear(): Promise<Cart>;
  };
  orders: {
    create(input: CreateOrderInput): Promise<Order>;
    pay(id: string, input?: PayOrderInput): Promise<Order>;
    cancel(id: string): Promise<Order>;
    listMine(): Promise<Order[]>;
    getMine(id: string): Promise<Order>;
    adminList(params?: OrderListParams): Promise<Paginated<Order>>;
    adminUpdateStatus(id: string, status: OrderStatus): Promise<Order>;
  };
}
