import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, signInAs } from '@/test/utils';
import { api } from '@/api';
import { HomePage } from '../home-page';
import { CatalogPage } from '../catalog-page';
import { ProductPage } from '../product-page';
import { CartPage } from '../cart-page';
import { CheckoutPage } from '../checkout-page';
import { OrdersPage } from '../orders-page';
import { OrderDetailPage } from '../order-detail-page';
import { LoginPage } from '../login-page';
import { RegisterPage } from '../register-page';
import { AccountPage } from '../account-page';
import { NotFoundPage } from '../not-found-page';
import { AdminPage } from '../admin/admin-page';

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

describe('page smoke tests (demo mode)', () => {
  it('renders the home page with categories and featured products', async () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/everyday essentials/i);
    expect((await screen.findAllByRole('link', { name: /audio/i })).length).toBeGreaterThan(0);
    expect(await screen.findByText('Aurora Wireless Headphones')).toBeInTheDocument();
  });

  it('renders the catalog with a product count and URL-driven category', async () => {
    renderWithProviders(<CatalogPage />, { route: '/catalog?category=fitness' });
    expect(await screen.findByRole('heading', { level: 1, name: 'Fitness' })).toBeInTheDocument();
    expect(await screen.findByText('4 products')).toBeInTheDocument();
  });

  it('shows an empty state for a search with no matches', async () => {
    renderWithProviders(<CatalogPage />, { route: '/catalog?q=zzzznothing' });
    expect(await screen.findByText('No products match')).toBeInTheDocument();
  });

  it('renders a product page from its slug and a 404 for an unknown one', async () => {
    renderWithProviders(<ProductPage />, {
      route: '/products/cork-yoga-mat',
      path: '/products/:slug',
    });
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Cork Yoga Mat' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add to cart: Cork Yoga Mat' })).toBeEnabled();

    renderWithProviders(<ProductPage />, { route: '/products/missing', path: '/products/:slug' });
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Product not found' }),
    ).toBeInTheDocument();
  });

  it('renders the cart page empty state for a signed-in shopper', async () => {
    await signInAs('user');
    renderWithProviders(<CartPage />);
    expect(await screen.findByText('Your cart is empty')).toBeInTheDocument();
  });

  it('renders checkout with the shipping form when the cart has items', async () => {
    await signInAs('user');
    const product = await api.products.getBySlug('cork-yoga-mat');
    await api.cart.add(product.id, 1);
    renderWithProviders(<CheckoutPage />);
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Shipping address' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Cork Yoga Mat')).toBeInTheDocument();
  });

  it('renders the orders list and an order detail with its timeline', async () => {
    await signInAs('user');
    const product = await api.products.getBySlug('brass-fountain-pen');
    await api.cart.add(product.id, 1);
    const order = await api.orders.create({ shippingAddress: address });

    renderWithProviders(<OrdersPage />);
    expect(await screen.findByText(/brass fountain pen × 1/i)).toBeInTheDocument();

    renderWithProviders(<OrderDetailPage />, { route: `/orders/${order.id}`, path: '/orders/:id' });
    expect(await screen.findByRole('button', { name: 'Pay now' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Order progress' })).toBeInTheDocument();
  });

  it('renders login with demo account shortcuts and register with its form', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in as shopper/i })).toBeInTheDocument();

    renderWithProviders(<RegisterPage />);
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('renders the account page with the profile form', async () => {
    await signInAs('user');
    renderWithProviders(<AccountPage />);
    await waitFor(() => expect(screen.getByLabelText('Name')).toHaveValue('Demo Shopper'));
    expect(screen.getByRole('button', { name: 'Reset demo data' })).toBeInTheDocument();
  });

  it('renders the admin products table for an admin', async () => {
    await signInAs('admin');
    renderWithProviders(<AdminPage />, { route: '/admin/products', path: '/admin/*' });
    expect(await screen.findByRole('heading', { level: 1, name: 'Admin' })).toBeInTheDocument();
    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New' })).toBeInTheDocument();
  });

  it('renders the 404 page', () => {
    renderWithProviders(<NotFoundPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go home' })).toBeInTheDocument();
  });
});
