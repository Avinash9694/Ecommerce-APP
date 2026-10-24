import { useMemo, useState } from 'react';
import type { Product } from '@/api';
import { errorMessage } from '@/api';
import { useCategories } from '@/features/categories/queries';
import { useDeleteProduct, useProducts } from '@/features/products/queries';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Price } from '@/components/ui/price';
import { ProductImage } from '@/components/ui/product-image';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { LineSkeleton } from '@/components/ui/skeleton';
import { PlusIcon, SearchIcon, TrashIcon } from '@/components/ui/icons';
import { toast } from '@/store/toast-store';
import { ProductFormDialog } from './product-form-dialog';

export function AdminProducts() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebouncedValue(search, 300);
  const params = useMemo(
    () => ({ page, limit: 10, sort: 'newest' as const, ...(q.trim() ? { q: q.trim() } : {}) }),
    [page, q],
  );
  const products = useProducts(params);
  const categories = useCategories();
  const remove = useDeleteProduct();
  const [editing, setEditing] = useState<Product | null | 'new'>(null);

  const onDelete = (product: Product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    remove.mutate(product.id, {
      onSuccess: () => toast.success('Product deleted'),
      onError: (err) => toast.error(errorMessage(err)),
    });
  };

  return (
    <section aria-labelledby="admin-products-heading" className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="admin-products-heading" className="text-lg font-semibold">
          Products{' '}
          {products.data && (
            <span className="text-sm font-normal text-ink-muted">({products.data.total})</span>
          )}
        </h2>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <label htmlFor="admin-product-search" className="sr-only">
              Search products
            </label>
            <SearchIcon
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle"
            />
            <input
              id="admin-product-search"
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search"
              className="h-10 w-full rounded-xl border border-line-strong bg-surface pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            />
          </div>
          <Button onClick={() => setEditing('new')} leadingIcon={<PlusIcon size={16} />}>
            New
          </Button>
        </div>
      </div>

      {products.isPending ? (
        <LineSkeleton lines={8} />
      ) : products.isError ? (
        <ErrorState error={products.error} onRetry={() => products.refetch()} />
      ) : products.data.items.length === 0 ? (
        <EmptyState
          title="No products"
          description={
            q ? 'Nothing matches that search.' : 'Create the first product to get started.'
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Product
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Category
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Price
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Stock
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Flags
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.data.items.map((product) => (
                <tr key={product.id} className="hover:bg-surface-2/60">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                        <ProductImage src={product.images[0]} alt="" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{product.name}</p>
                        <p className="truncate font-mono text-xs text-ink-muted">{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-ink-muted">{product.category.name}</td>
                  <td className="px-4 py-2 text-right">
                    <Price amount={product.price} currency={product.currency} />
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    <span
                      className={
                        product.stock === 0
                          ? 'text-danger'
                          : product.stock <= 5
                            ? 'text-warning'
                            : undefined
                      }
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {product.featured && <Badge tone="accent">Featured</Badge>}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(product)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(product)}
                        aria-label={`Delete ${product.name}`}
                        className="text-danger"
                      >
                        <TrashIcon size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {products.data && (
        <Pagination
          page={products.data.page}
          totalPages={products.data.totalPages}
          onChange={setPage}
        />
      )}

      <ProductFormDialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        product={editing === 'new' ? null : editing}
        categories={categories.data ?? []}
      />
    </section>
  );
}
