import { Link } from 'react-router-dom';
import { useMyOrders } from '@/features/orders/queries';
import { OrderStatusBadge } from '@/components/ui/badge';
import { Price } from '@/components/ui/price';
import { ProductImage } from '@/components/ui/product-image';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { LineSkeleton } from '@/components/ui/skeleton';
import { LinkButton } from '@/components/ui/button';
import { ChevronRightIcon, PackageIcon } from '@/components/ui/icons';
import { formatDateTime } from '@/lib/dates';

export function OrdersPage() {
  const orders = useMyOrders();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Your orders</h1>
      {orders.isPending ? (
        <LineSkeleton lines={6} />
      ) : orders.isError ? (
        <ErrorState error={orders.error} onRetry={() => orders.refetch()} />
      ) : orders.data.length === 0 ? (
        <EmptyState
          icon={<PackageIcon size={24} />}
          title="No orders yet"
          description="When you place an order it will show up here with its delivery progress."
          action={<LinkButton to="/catalog">Start shopping</LinkButton>}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.data.map((order) => (
            <li key={order.id}>
              <Link
                to={`/orders/${order.id}`}
                className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 shadow-card transition-shadow hover:shadow-pop sm:flex-row sm:items-center"
              >
                <div className="flex -space-x-3">
                  {order.items.slice(0, 3).map((item) => (
                    <span
                      key={item.product}
                      className="h-14 w-14 overflow-hidden rounded-lg border-2 border-surface bg-surface-2"
                    >
                      <ProductImage src={item.image} alt="" />
                    </span>
                  ))}
                  {order.items.length > 3 && (
                    <span className="flex h-14 w-14 items-center justify-center rounded-lg border-2 border-surface bg-surface-2 text-xs font-medium">
                      +{order.items.length - 3}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    <span className="font-mono text-xs text-ink-muted">
                      #{order.id.slice(-8).toUpperCase()}
                    </span>
                    <OrderStatusBadge status={order.status} />
                  </p>
                  <p className="mt-1 line-clamp-1 text-sm">
                    {order.items.map((i) => `${i.name} × ${i.qty}`).join(', ')}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-muted">{formatDateTime(order.createdAt)}</p>
                </div>
                <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                  <Price
                    amount={order.totals.total}
                    currency={order.currency}
                    className="font-semibold"
                  />
                  <span className="flex items-center gap-1 text-sm text-accent">
                    Details <ChevronRightIcon size={16} />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
