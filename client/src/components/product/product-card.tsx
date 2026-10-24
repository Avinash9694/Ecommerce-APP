import { Link } from 'react-router-dom';
import type { Product } from '@/api';
import { Price } from '@/components/ui/price';
import { ProductImage } from '@/components/ui/product-image';
import { RatingStars } from '@/components/ui/rating-stars';
import { Badge } from '@/components/ui/badge';
import { AddToCartButton } from './add-to-cart-button';

export function ProductCard({ product }: { product: Product }) {
  const lowStock = product.stock > 0 && product.stock <= 5;
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-card transition-shadow hover:shadow-pop">
      <Link
        to={`/products/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-surface-2"
      >
        <ProductImage
          src={product.images[0]}
          alt={product.name}
          className="transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute left-2 top-2 flex gap-1.5">
          {product.featured && <Badge tone="accent">Featured</Badge>}
          {product.stock === 0 && <Badge tone="danger">Sold out</Badge>}
          {lowStock && <Badge tone="warning">Only {product.stock} left</Badge>}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
          {product.category.name}
        </p>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug sm:text-base">
          <Link to={`/products/${product.slug}`} className="hover:underline">
            {product.name}
          </Link>
        </h3>
        <RatingStars average={product.rating.average} count={product.rating.count} size={12} />
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <Price
            amount={product.price}
            currency={product.currency}
            className="text-base font-semibold"
          />
          <div className="hidden sm:block">
            <AddToCartButton product={product} size="sm" variant="secondary" label="Add" />
          </div>
        </div>
        <div className="sm:hidden">
          <AddToCartButton product={product} size="sm" variant="secondary" className="w-full" />
        </div>
      </div>
    </article>
  );
}
