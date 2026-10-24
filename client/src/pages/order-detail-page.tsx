import { Link, useParams } from 'react-router-dom';
import { useCancelOrder, useOrder, usePayOrder } from '@/features/orders/queries';
import { errorMessage, isApiError } from '@/api';
import { OrderStatusBadge } from '@/components/ui/badge';
import { Price } from '@/components/ui/price';
import { ProductImage } from '@/components/ui/product-image';
import { ErrorState } from '@/components/ui/states';
import { LineSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { StatusTimeline } from '@/components/orders/status-timeline';
import { CartSummary } from '@/components/cart/cart-summary';
import { formatDateTime } from '@/lib/dates';
import { toast } from '@/store/toast-store';
import { NotFoundPage } from './not-found-page';

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const order = useOrder(id);
  const pay = usePayOrder();
  const cancel = useCancelOrder();

  if (order.isPending) return <LineSkeleton lines={8} />;
  if (order.isError) {
    if (isApiError(order.error) && order.error.status === 404)
      return <NotFoundPage title="Order not found" />;
    return <ErrorState error={order.error} onRetry={() => order.refetch()} />;
  }

  const o = order.data;
  const canCancel = o.status === 'placed' || o.status === 'paid';
  const itemCount = o.items.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
        <Link to="/orders" className="hover:underline">
          Orders
        </Link>{' '}
        <span aria-hidden="true">/</span>{' '}
        <span className="font-mono text-xs text-ink">#{o.id.slice(-8).toUpperCase()}</span>
      </nav>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Order #{o.id.slice(-8).toUpperCase()} <OrderStatusBadge status={o.status} />
          </h1>
          <p className="mt-1 text-sm text-ink-muted">Placed {formatDateTime(o.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          {o.status === 'placed' && (
            <Button
              isLoading={pay.isPending}
              onClick={() =>
                pay.mutate(
                  { id: o.id },
                  {
                    onSuccess: () => toast.success('Payment confirmed'),
                    onError: (err) => toast.error(errorMessage(err)),
                  },
                )
              }
            >
              Pay now
            </Button>
          )}
          {canCancel && (
            <Button
              variant="danger"
              isLoading={cancel.isPending}
              onClick={() => {
                if (
                  !window.confirm(
                    'Cancel this order? Stock will be released and any payment refunded.',
                  )
                )
                  return;
                cancel.mutate(o.id, {
                  onSuccess: () => toast.info('Order cancelled'),
                  onError: (err) => toast.error(errorMessage(err)),
                });
              }}
            >
              Cancel order
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          <section
            aria-labelledby="items-heading"
            className="rounded-2xl border border-line bg-surface p-5 shadow-card"
          >
            <h2 id="items-heading" className="mb-3 text-lg font-semibold">
              Items
            </h2>
            <ul className="divide-y divide-line">
              {o.items.map((item) => (
                <li key={item.product} className="flex items-center gap-3 py-3">
                  <span className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                    <ProductImage src={item.image} alt="" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/products/${item.slug}`}
                      className="line-clamp-1 text-sm font-medium hover:underline"
                    >
                      {item.name}
                    </Link>
                    <p className="text-sm text-ink-muted">
                      <Price amount={item.price} currency={item.currency} /> × {item.qty}
                    </p>
                  </div>
                  <Price
                    amount={item.price * item.qty}
                    currency={item.currency}
                    className="font-medium"
                  />
                </li>
              ))}
            </ul>
            <div className="mt-3 border-t border-line pt-4">
              <CartSummary totals={o.totals} itemCount={itemCount} currency={o.currency} />
            </div>
          </section>

          <section
            aria-labelledby="shipping-heading"
            className="grid gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card sm:grid-cols-2"
          >
            <div>
              <h2 id="shipping-heading" className="mb-2 text-lg font-semibold">
                Shipping to
              </h2>
              <address className="text-sm not-italic leading-relaxed text-ink-muted">
                <span className="font-medium text-ink">{o.shippingAddress.fullName}</span>
                <br />
                {o.shippingAddress.line1}
                {o.shippingAddress.line2 && (
                  <>
                    <br />
                    {o.shippingAddress.line2}
                  </>
                )}
                <br />
                {o.shippingAddress.city}, {o.shippingAddress.state} {o.shippingAddress.postalCode}
                <br />
                {o.shippingAddress.country}
                <br />
                {o.shippingAddress.phone}
              </address>
            </div>
            <div>
              <h2 className="mb-2 text-lg font-semibold">Payment</h2>
              <dl className="text-sm text-ink-muted">
                <div className="flex justify-between py-1">
                  <dt>Provider</dt>
                  <dd className="capitalize text-ink">{o.payment.provider}</dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt>Status</dt>
                  <dd className="capitalize text-ink">{o.payment.status}</dd>
                </div>
                {o.payment.reference && (
                  <div className="flex justify-between py-1">
                    <dt>Reference</dt>
                    <dd className="font-mono text-xs text-ink">{o.payment.reference}</dd>
                  </div>
                )}
                {o.payment.paidAt && (
                  <div className="flex justify-between py-1">
                    <dt>Paid</dt>
                    <dd className="text-ink">{formatDateTime(o.payment.paidAt)}</dd>
                  </div>
                )}
              </dl>
            </div>
          </section>
        </div>

        <aside
          aria-labelledby="progress-heading"
          className="h-fit rounded-2xl border border-line bg-surface p-5 shadow-card"
        >
          <h2 id="progress-heading" className="mb-4 text-lg font-semibold">
            Progress
          </h2>
          <StatusTimeline order={o} />
        </aside>
      </div>
    </div>
  );
}
