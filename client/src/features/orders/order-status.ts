import type { OrderStatus } from '@/api/types';

export type StatusTone = 'neutral' | 'accent' | 'danger' | 'warning' | 'info';

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; tone: StatusTone }> = {
  placed: { label: 'Awaiting payment', tone: 'warning' },
  paid: { label: 'Paid', tone: 'info' },
  shipped: { label: 'Shipped', tone: 'info' },
  delivered: { label: 'Delivered', tone: 'accent' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
};
