import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { OrderStatus } from '@/api';
import { ORDER_STATUS_META } from '@/features/orders/order-status';
import type { StatusTone } from '@/features/orders/order-status';

const tones: Record<StatusTone, string> = {
  neutral: 'bg-surface-2 text-ink-muted',
  accent: 'bg-accent-soft text-accent-soft-fg',
  danger: 'bg-danger-soft text-danger',
  warning: 'bg-warning-soft text-warning',
  info: 'bg-info-soft text-info',
};

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: StatusTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const meta = ORDER_STATUS_META[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
