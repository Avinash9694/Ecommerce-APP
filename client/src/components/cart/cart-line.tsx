import { Link } from 'react-router-dom';
import type { CartItem } from '@/api';
import { useRemoveCartItem, useUpdateCartItem } from '@/features/cart/queries';
import { Price } from '@/components/ui/price';
import { ProductImage } from '@/components/ui/product-image';
import { QtyStepper } from '@/components/ui/qty-stepper';
import { TrashIcon } from '@/components/ui/icons';

export function CartLine({
  item,
  compact = false,
  onNavigate,
}: {
  item: CartItem;
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();
  const { product } = item;

  return (
    <li className="flex gap-3 py-4">
      <Link
        to={`/products/${product.slug}`}
        onClick={onNavigate}
        className={
          compact
            ? 'h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-2'
            : 'h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-2 sm:h-28 sm:w-28'
        }
      >
        <ProductImage src={product.images[0]} alt={product.name} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              to={`/products/${product.slug}`}
              onClick={onNavigate}
              className="line-clamp-2 text-sm font-medium hover:underline"
            >
              {product.name}
            </Link>
            <p className="mt-0.5 text-sm text-ink-muted">
              <Price amount={product.price} currency={product.currency} /> each
            </p>
          </div>
          <Price
            amount={item.lineTotal}
            currency={product.currency}
            className="shrink-0 text-sm font-semibold"
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <QtyStepper
            value={item.qty}
            max={product.stock}
            size="sm"
            label={`Quantity for ${product.name}`}
            onChange={(qty) => update.mutate({ productId: product.id, qty })}
            disabled={update.isPending}
          />
          <button
            type="button"
            onClick={() => remove.mutate(product.id)}
            disabled={remove.isPending}
            className="flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm text-ink-muted hover:bg-surface-2 hover:text-danger"
            aria-label={`Remove ${product.name} from cart`}
          >
            <TrashIcon size={16} />
            <span className="hidden sm:inline">Remove</span>
          </button>
        </div>
        {item.qty >= product.stock && product.stock > 0 && (
          <p className="text-xs text-warning">Maximum available quantity</p>
        )}
      </div>
    </li>
  );
}
