import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/cn';

export function Price({
  amount,
  currency = 'INR',
  className,
}: {
  amount: number;
  currency?: string;
  className?: string;
}) {
  return <span className={cn('tabular-nums', className)}>{formatMoney(amount, currency)}</span>;
}
