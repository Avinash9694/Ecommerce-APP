import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { AdminProducts } from './admin-products';
import { AdminOrders } from './admin-orders';

const tab = ({ isActive }: { isActive: boolean }) =>
  cn(
    'inline-flex min-h-10 items-center border-b-2 px-3 text-sm font-medium transition-colors',
    isActive ? 'border-accent text-ink' : 'border-transparent text-ink-muted hover:text-ink',
  );

export function AdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Admin</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Manage the catalog and move orders through fulfilment.
        </p>
      </div>
      <nav aria-label="Admin sections" className="flex gap-2 border-b border-line">
        <NavLink to="/admin/products" className={tab}>
          Products
        </NavLink>
        <NavLink to="/admin/orders" className={tab}>
          Orders
        </NavLink>
      </nav>
      <Routes>
        <Route index element={<Navigate to="products" replace />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders />} />
      </Routes>
    </div>
  );
}
