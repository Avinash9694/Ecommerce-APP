import type { ProductListParams, ProductSort } from '@/api/types';

export const PRODUCT_SORTS: ReadonlyArray<{ value: ProductSort; label: string }> = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
  { value: 'name', label: 'Name A–Z' },
];

export const CATALOG_PAGE_SIZE = 12;

export interface CatalogParams {
  q: string;
  category: string;
  sort: ProductSort;
  page: number;
  minPrice: number | null;
  maxPrice: number | null;
}

export const DEFAULT_CATALOG_PARAMS: CatalogParams = {
  q: '',
  category: '',
  sort: 'newest',
  page: 1,
  minPrice: null,
  maxPrice: null,
};

const isSort = (value: string | null): value is ProductSort =>
  PRODUCT_SORTS.some((s) => s.value === value);

function positiveInt(value: string | null): number | null {
  if (value === null || value === '') return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

export function parseCatalogParams(search: URLSearchParams): CatalogParams {
  const sort = search.get('sort');
  const page = positiveInt(search.get('page'));
  return {
    q: (search.get('q') ?? '').trim(),
    category: search.get('category') ?? '',
    sort: isSort(sort) ? sort : 'newest',
    page: page && page >= 1 ? page : 1,
    minPrice: positiveInt(search.get('min')),
    maxPrice: positiveInt(search.get('max')),
  };
}

/** Serialises params, omitting defaults so URLs stay short and shareable. */
export function serializeCatalogParams(params: CatalogParams): URLSearchParams {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.category) search.set('category', params.category);
  if (params.sort !== 'newest') search.set('sort', params.sort);
  if (params.page > 1) search.set('page', String(params.page));
  if (params.minPrice !== null) search.set('min', String(params.minPrice));
  if (params.maxPrice !== null) search.set('max', String(params.maxPrice));
  return search;
}

export function toListParams(params: CatalogParams): ProductListParams {
  const list: ProductListParams = {
    page: params.page,
    limit: CATALOG_PAGE_SIZE,
    sort: params.sort,
  };
  if (params.q) list.q = params.q;
  if (params.category) list.category = params.category;
  if (params.minPrice !== null) list.minPrice = params.minPrice;
  if (params.maxPrice !== null) list.maxPrice = params.maxPrice;
  return list;
}

export function countActiveFilters(params: CatalogParams): number {
  return [params.category, params.minPrice !== null || params.maxPrice !== null].filter(Boolean)
    .length;
}
