import type { Totals } from '@/api';
import { Price } from '@/components/ui/price';
import { amountToFreeShipping } from '@/lib/pricing';

export function CartSummary({
  totals,
  currency = 'INR',
  itemCount,
}: {
  totals: Totals;
  currency?: string;
  itemCount: number;
}) {
  const remaining = amountToFreeShipping(totals.subtotal);
  return (
    <dl className="flex flex-col gap-2 text-sm">
      <div className="flex justify-between">
        <dt className="text-ink-muted">
          Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})
        </dt>
        <dd>
          <Price amount={totals.subtotal} currency={currency} />
        </dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-ink-muted">Shipping</dt>
        <dd>
          {totals.shipping === 0 ? (
            <span className="text-accent">Free</span>
          ) : (
            <Price amount={totals.shipping} currency={currency} />
          )}
        </dd>
      </div>
      {remaining > 0 && totals.subtotal > 0 && (
        <p className="rounded-lg bg-accent-soft px-3 py-2 text-xs text-accent-soft-fg">
          Add <Price amount={remaining} currency={currency} /> more for free shipping
        </p>
      )}
      <div className="mt-1 flex justify-between border-t border-line pt-3 text-base font-semibold">
        <dt>Total</dt>
        <dd>
          <Price amount={totals.total} currency={currency} />
        </dd>
      </div>
    </dl>
  );
}
