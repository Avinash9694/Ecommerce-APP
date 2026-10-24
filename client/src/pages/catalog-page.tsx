import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCategories } from '@/features/categories/queries';
import { useProducts } from '@/features/products/queries';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  PRODUCT_SORTS,
  countActiveFilters,
  parseCatalogParams,
  serializeCatalogParams,
  toListParams,
} from '@/lib/catalog-params';
import type { CatalogParams } from '@/lib/catalog-params';
import type { Category, ProductSort } from '@/api';
import { ProductGrid } from '@/components/product/product-grid';
import { ProductGridSkeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Pagination } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { InputField, SelectField } from '@/components/ui/field';
import { FilterIcon, SearchIcon } from '@/components/ui/icons';
import { cn } from '@/lib/cn';
import { majorUnits, parseMoneyInput } from '@/lib/money';

const PRICE_PRESETS: Array<{ label: string; min: number | null; max: number | null }> = [
  { label: 'Any price', min: null, max: null },
  { label: 'Under ₹1,000', min: null, max: 99900 },
  { label: '₹1,000 – ₹3,000', min: 100000, max: 300000 },
  { label: '₹3,000 – ₹8,000', min: 300000, max: 800000 },
  { label: 'Over ₹8,000', min: 800000, max: null },
];

interface FiltersProps {
  params: CatalogParams;
  categories: Category[] | undefined;
  onChange: (patch: Partial<CatalogParams>) => void;
  onReset: () => void;
  idPrefix: string;
}

function Filters({ params, categories, onChange, onReset, idPrefix }: FiltersProps) {
  const [min, setMin] = useState(params.minPrice === null ? '' : majorUnits(params.minPrice));
  const [max, setMax] = useState(params.maxPrice === null ? '' : majorUnits(params.maxPrice));

  useEffect(() => {
    setMin(params.minPrice === null ? '' : majorUnits(params.minPrice));
    setMax(params.maxPrice === null ? '' : majorUnits(params.maxPrice));
  }, [params.minPrice, params.maxPrice]);

  const applyPrice = () => {
    const minPrice = min.trim() ? parseMoneyInput(min) : null;
    const maxPrice = max.trim() ? parseMoneyInput(max) : null;
    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      onChange({ minPrice: maxPrice, maxPrice: minPrice });
      return;
    }
    onChange({ minPrice, maxPrice });
  };

  const activePreset = PRICE_PRESETS.findIndex(
    (p) => p.min === params.minPrice && p.max === params.maxPrice,
  );
  const radio =
    'flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg px-2 text-sm hover:bg-surface-2';

  return (
    <div className="flex flex-col gap-6">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Category</legend>
        <div className="flex flex-col">
          <label className={radio}>
            <input
              type="radio"
              name={`${idPrefix}-category`}
              className="accent-accent"
              checked={params.category === ''}
              onChange={() => onChange({ category: '' })}
            />
            All categories
          </label>
          {(categories ?? []).map((c) => (
            <label key={c.id} className={radio}>
              <input
                type="radio"
                name={`${idPrefix}-category`}
                className="accent-accent"
                checked={params.category === c.slug}
                onChange={() => onChange({ category: c.slug })}
              />
              <span className="flex-1">{c.name}</span>
              <span className="text-xs text-ink-subtle tabular-nums">{c.productCount ?? ''}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Price</legend>
        <div className="flex flex-col">
          {PRICE_PRESETS.map((preset, index) => (
            <label key={preset.label} className={radio}>
              <input
                type="radio"
                name={`${idPrefix}-price`}
                className="accent-accent"
                checked={activePreset === index}
                onChange={() => onChange({ minPrice: preset.min, maxPrice: preset.max })}
              />
              {preset.label}
            </label>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-[1fr_1fr_auto] items-end gap-2">
          <InputField
            label="Min (₹)"
            inputMode="numeric"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            className="h-10"
          />
          <InputField
            label="Max (₹)"
            inputMode="numeric"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            className="h-10"
          />
          <Button variant="secondary" onClick={applyPrice} className="h-10">
            Go
          </Button>
        </div>
      </fieldset>

      <Button
        variant="ghost"
        onClick={onReset}
        disabled={countActiveFilters(params) === 0 && !params.q}
      >
        Clear all filters
      </Button>
    </div>
  );
}

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(() => parseCatalogParams(searchParams), [searchParams]);
  const categories = useCategories();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [searchInput, setSearchInput] = useState(params.q);
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  const update = (patch: Partial<CatalogParams>, options?: { replace?: boolean }) => {
    const next: CatalogParams = { ...params, ...patch };
    // Any change other than paging returns to page one.
    if (!('page' in patch)) next.page = 1;
    setSearchParams(serializeCatalogParams(next), { replace: options?.replace ?? false });
  };

  useEffect(() => {
    if (debouncedSearch.trim() !== params.q)
      update({ q: debouncedSearch.trim() }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    // Keep the box in sync when the URL changes from elsewhere (header search, back button).
    setSearchInput((current) => (current.trim() === params.q ? current : params.q));
  }, [params.q]);

  const products = useProducts(toListParams(params));
  const activeCategory = categories.data?.find((c) => c.slug === params.category);
  const activeFilterCount = countActiveFilters(params);

  const reset = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  const filtersProps = {
    params,
    categories: categories.data,
    onChange: update,
    onReset: reset,
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {activeCategory?.name ?? 'All products'}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          {activeCategory?.description ?? 'Everything in the store, filtered and sorted your way.'}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        {isDesktop && (
          <aside
            aria-label="Filters"
            className="sticky top-24 self-start rounded-xl border border-line bg-surface p-4"
          >
            <Filters {...filtersProps} idPrefix="desktop" />
          </aside>
        )}

        <section aria-labelledby="results-heading" className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="relative flex-1">
              <label htmlFor="catalog-search" className="sr-only">
                Search products
              </label>
              <SearchIcon
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle"
              />
              <input
                id="catalog-search"
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name, description or tag"
                className="h-11 w-full rounded-xl border border-line-strong bg-surface pl-10 pr-3 text-sm placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              />
            </div>
            <div className="flex gap-2">
              <SelectField
                label="Sort by"
                value={params.sort}
                onChange={(e) => update({ sort: e.target.value as ProductSort })}
                wrapperClassName="flex-1 sm:w-48"
              >
                {PRODUCT_SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </SelectField>
              {!isDesktop && (
                <Button
                  variant="outline"
                  className="h-11 self-end"
                  onClick={() => setFiltersOpen(true)}
                  leadingIcon={<FilterIcon size={18} />}
                >
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs text-accent-fg">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              )}
            </div>
          </div>

          <p
            id="results-heading"
            className={cn('text-sm text-ink-muted', products.isFetching && 'opacity-70')}
            aria-live="polite"
          >
            {products.data
              ? `${products.data.total} ${products.data.total === 1 ? 'product' : 'products'}`
              : 'Loading products'}
            {params.q && ` for “${params.q}”`}
          </p>

          {products.isPending ? (
            <ProductGridSkeleton count={8} />
          ) : products.isError ? (
            <ErrorState error={products.error} onRetry={() => products.refetch()} />
          ) : products.data.items.length === 0 ? (
            <EmptyState
              title="No products match"
              description="Try a different search term, or clear the filters to see everything."
              action={
                <Button variant="outline" onClick={reset}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <>
              <ProductGrid products={products.data.items} />
              <Pagination
                page={products.data.page}
                totalPages={products.data.totalPages}
                onChange={(page) => update({ page })}
              />
            </>
          )}
        </section>
      </div>

      <Dialog
        open={filtersOpen && !isDesktop}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        variant="sheet"
        footer={
          <Button className="w-full" onClick={() => setFiltersOpen(false)}>
            Show results
          </Button>
        }
      >
        <Filters {...filtersProps} idPrefix="mobile" />
      </Dialog>
    </div>
  );
}
