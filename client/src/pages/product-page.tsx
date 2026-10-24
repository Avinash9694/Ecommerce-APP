import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useProduct, useRelatedProducts } from '@/features/products/queries';
import { isApiError } from '@/api';
import { ProductImage } from '@/components/ui/product-image';
import { Price } from '@/components/ui/price';
import { RatingStars } from '@/components/ui/rating-stars';
import { Badge } from '@/components/ui/badge';
import { QtyStepper } from '@/components/ui/qty-stepper';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { SectionHeading } from '@/components/ui/section-heading';
import { ProductGrid } from '@/components/product/product-grid';
import { AddToCartButton } from '@/components/product/add-to-cart-button';
import { cn } from '@/lib/cn';
import { NotFoundPage } from './not-found-page';

function ProductSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-2" aria-busy="true" aria-label="Loading product">
      <Skeleton className="aspect-square rounded-2xl" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-48" />
      </div>
    </div>
  );
}

export function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const product = useProduct(slug);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const related = useRelatedProducts(product.data?.category.slug, product.data?.id);

  if (product.isPending) return <ProductSkeleton />;
  if (product.isError) {
    if (isApiError(product.error) && product.error.status === 404)
      return <NotFoundPage title="Product not found" />;
    return <ErrorState error={product.error} onRetry={() => product.refetch()} />;
  }

  const p = product.data;
  const images = p.images.length ? p.images : [undefined];
  const current = images[Math.min(activeImage, images.length - 1)];
  const maxQty = Math.min(p.stock, 99);

  return (
    <div className="flex flex-col gap-14">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link to="/catalog" className="hover:underline">
              Shop
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link to={`/catalog?category=${p.category.slug}`} className="hover:underline">
              {p.category.name}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink">
            {p.name}
          </li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="flex flex-col gap-3">
          <div className="aspect-square overflow-hidden rounded-2xl border border-line bg-surface-2">
            <ProductImage src={current} alt={p.name} loading="eager" />
          </div>
          {images.length > 1 && (
            <ul className="flex gap-2" aria-label="Product images">
              {images.map((img, index) => (
                <li key={img ?? index}>
                  <button
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-label={`Show image ${index + 1}`}
                    aria-pressed={index === activeImage}
                    className={cn(
                      'h-20 w-20 overflow-hidden rounded-xl border-2 bg-surface-2',
                      index === activeImage
                        ? 'border-accent'
                        : 'border-line hover:border-line-strong',
                    )}
                  >
                    <ProductImage src={img} alt="" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              {p.category.name}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{p.name}</h1>
            <RatingStars average={p.rating.average} count={p.rating.count} size={16} />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Price amount={p.price} currency={p.currency} className="text-3xl font-semibold" />
            {p.stock === 0 ? (
              <Badge tone="danger">Sold out</Badge>
            ) : p.stock <= 5 ? (
              <Badge tone="warning">Only {p.stock} left</Badge>
            ) : (
              <Badge tone="accent">In stock</Badge>
            )}
          </div>
          <p className="text-base leading-relaxed text-ink-muted">{p.description}</p>
          {p.tags.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Tags">
              {p.tags.map((tag) => (
                <li key={tag}>
                  <Link
                    to={`/catalog?q=${encodeURIComponent(tag)}`}
                    className="inline-flex min-h-8 items-center rounded-full border border-line px-3 text-xs text-ink-muted hover:border-line-strong hover:text-ink"
                  >
                    #{tag}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 sm:flex-row sm:items-center">
            <QtyStepper
              value={qty}
              max={Math.max(1, maxQty)}
              onChange={setQty}
              disabled={p.stock === 0}
            />
            <AddToCartButton product={p} qty={qty} size="lg" className="flex-1" />
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-surface-2 p-3">
              <dt className="text-ink-muted">Delivery</dt>
              <dd className="font-medium">3–5 business days</dd>
            </div>
            <div className="rounded-lg bg-surface-2 p-3">
              <dt className="text-ink-muted">SKU</dt>
              <dd className="truncate font-mono text-xs">{p.slug}</dd>
            </div>
          </dl>
        </div>
      </div>

      {related.items.length > 0 && (
        <section aria-labelledby="related-heading">
          <SectionHeading
            title="You might also like"
            link={{
              to: `/catalog?category=${p.category.slug}`,
              label: `More in ${p.category.name}`,
            }}
          />
          <ProductGrid products={related.items} />
        </section>
      )}
    </div>
  );
}
