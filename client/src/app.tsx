import { HashRouter, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AuthProvider } from '@/features/auth/auth-context';
import { AppLayout } from '@/components/layout/app-layout';
import { ProtectedRoute } from '@/routes/protected-route';
import { HomePage } from '@/pages/home-page';
import { CatalogPage } from '@/pages/catalog-page';
import { ProductPage } from '@/pages/product-page';
import { CartPage } from '@/pages/cart-page';
import { CheckoutPage } from '@/pages/checkout-page';
import { OrdersPage } from '@/pages/orders-page';
import { OrderDetailPage } from '@/pages/order-detail-page';
import { LoginPage } from '@/pages/login-page';
import { RegisterPage } from '@/pages/register-page';
import { AccountPage } from '@/pages/account-page';
import { AdminPage } from '@/pages/admin/admin-page';
import { NotFoundPage } from '@/pages/not-found-page';
import { createQueryClient } from '@/lib/query-client';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="products/:slug" element={<ProductPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="account" element={<AccountPage />} />
        </Route>
        <Route element={<ProtectedRoute adminOnly />}>
          <Route path="admin/*" element={<AdminPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export function App() {
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
