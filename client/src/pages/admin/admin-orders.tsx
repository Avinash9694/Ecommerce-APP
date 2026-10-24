import { useState } from 'react';
import type { OrderStatus } from '@/api';
import { ORDER_TRANSITIONS, errorMessage } from '@/api';
import { useAdminOrders, useUpdateOrderStatus } from '@/features/orders/queries';
import { OrderStatusBadge } from '@/components/ui/badge';
import { ORDER_STATUS_META } from '@/features/orders/order-status';
import { Price } from '@/components/ui/price';
import { Pagination } from '@/components/ui/pagination';
import { SelectField } from '@/components/ui/field';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { LineSkeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/lib/dates';
import { toast } from '@/store/toast-store';

const STATUSES = Object.keys(ORDER_STATUS_META) as OrderStatus[];

export function AdminOrders() {
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [page, setPage] = useState(1);
  const orders = useAdminOrders({ page, limit: 10, ...(status ? { status } : {}) });
  const updateStatus = useUpdateOrderStatus();

  const change = (id: string, next: OrderStatus) => {
    updateStatus.mutate(
      { id, status: next },
      {
        onSuccess: () =>
          toast.success(`Order marked ${ORDER_STATUS_META[next].label.toLowerCase()}`),
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  };

  return (
    <section aria-labelledby="admin-orders-heading" className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 id="admin-orders-heading" className="text-lg font-semibold">
          Orders{' '}
          {orders.data && (
            <span className="text-sm font-normal text-ink-muted">({orders.data.total})</span>
          )}
        </h2>
        <SelectField
          label="Filter by status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as OrderStatus | '');
            setPage(1);
          }}
          wrapperClassName="sm:w-56"
          className="h-10"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_META[s].label}
            </option>
          ))}
        </SelectField>
      </div>

      {orders.isPending ? (
        <LineSkeleton lines={8} />
      ) : orders.isError ? (
        <ErrorState error={orders.error} onRetry={() => orders.refetch()} />
      ) : orders.data.items.length === 0 ? (
        <EmptyState
          title="No orders"
          description={
            status ? 'No orders in this status.' : 'Orders placed by customers will appear here.'
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Order
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Customer
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Items
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Total
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Move to
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.data.items.map((order) => {
                const customer = typeof order.user === 'object' && order.user ? order.user : null;
                const allowed = ORDER_TRANSITIONS[order.status];
                return (
                  <tr key={order.id} className="hover:bg-surface-2/60">
                    <td className="px-4 py-2">
                      <p className="font-mono text-xs">#{order.id.slice(-8).toUpperCase()}</p>
                      <p className="text-xs text-ink-muted">{formatDateTime(order.createdAt)}</p>
                    </td>
                    <td className="px-4 py-2">
                      <p className="font-medium">{customer?.name ?? '—'}</p>
                      <p className="truncate text-xs text-ink-muted">{customer?.email}</p>
                    </td>
                    <td className="px-4 py-2 text-ink-muted">
                      {order.items.reduce((s, i) => s + i.qty, 0)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Price amount={order.totals.total} currency={order.currency} />
                    </td>
                    <td className="px-4 py-2">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-2">
                      {allowed.length === 0 ? (
                        <span className="text-xs text-ink-subtle">Final</span>
                      ) : (
                        <>
                          <label htmlFor={`status-${order.id}`} className="sr-only">
                            Change status for order {order.id}
                          </label>
                          <select
                            id={`status-${order.id}`}
                            value=""
                            onChange={(e) =>
                              e.target.value && change(order.id, e.target.value as OrderStatus)
                            }
                            disabled={updateStatus.isPending}
                            className="h-9 rounded-lg border border-line-strong bg-surface px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                          >
                            <option value="">Choose…</option>
                            {allowed.map((s) => (
                              <option key={s} value={s}>
                                {ORDER_STATUS_META[s].label}
                              </option>
                            ))}
                          </select>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {orders.data && (
        <Pagination
          page={orders.data.page}
          totalPages={orders.data.totalPages}
          onChange={setPage}
        />
      )}
    </section>
  );
}
