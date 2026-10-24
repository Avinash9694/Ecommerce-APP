import type { Order, OrderStatus } from '@/api';
import { ORDER_STATUS_META } from '@/features/orders/order-status';
import { CheckIcon, CloseIcon } from '@/components/ui/icons';
import { formatDateTime } from '@/lib/dates';
import { cn } from '@/lib/cn';

const HAPPY_PATH: OrderStatus[] = ['placed', 'paid', 'shipped', 'delivered'];

const STEP_LABELS: Record<OrderStatus, string> = {
  placed: 'Order placed',
  paid: 'Payment received',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function StatusTimeline({ order }: { order: Order }) {
  const reached = new Map(order.statusHistory.map((h) => [h.status, h.at]));
  const cancelled = order.status === 'cancelled';
  const steps: OrderStatus[] = cancelled
    ? [...HAPPY_PATH.filter((s) => reached.has(s)), 'cancelled']
    : HAPPY_PATH;

  return (
    <ol className="flex flex-col gap-0" aria-label="Order progress">
      {steps.map((status, index) => {
        const at = reached.get(status);
        const done = Boolean(at);
        const isCancel = status === 'cancelled';
        const isLast = index === steps.length - 1;
        return (
          <li key={status} className="relative flex gap-3 pb-6 last:pb-0">
            {!isLast && (
              <span
                className={cn(
                  'absolute left-[11px] top-6 h-[calc(100%-12px)] w-0.5',
                  done ? 'bg-accent' : 'bg-line-strong',
                )}
                aria-hidden="true"
              />
            )}
            <span
              className={cn(
                'relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px]',
                isCancel && done
                  ? 'border-danger bg-danger-soft text-danger'
                  : done
                    ? 'border-accent bg-accent text-accent-fg'
                    : 'border-line-strong bg-surface text-ink-subtle',
              )}
              aria-hidden="true"
            >
              {done ? isCancel ? <CloseIcon size={12} /> : <CheckIcon size={12} /> : index + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className={cn('text-sm font-medium', !done && 'text-ink-muted')}>
                {STEP_LABELS[status]}
                {status === order.status && (
                  <span className="sr-only"> (current: {ORDER_STATUS_META[status].label})</span>
                )}
              </p>
              <p className="text-xs text-ink-subtle">{at ? formatDateTime(at) : 'Pending'}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
