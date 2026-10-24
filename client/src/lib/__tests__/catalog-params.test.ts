import { describe, expect, it } from 'vitest';
import {
  CATALOG_PAGE_SIZE,
  DEFAULT_CATALOG_PARAMS,
  countActiveFilters,
  parseCatalogParams,
  serializeCatalogParams,
  toListParams,
} from '../catalog-params';

describe('parseCatalogParams', () => {
  it('returns defaults for an empty query string', () => {
    expect(parseCatalogParams(new URLSearchParams())).toEqual(DEFAULT_CATALOG_PARAMS);
  });

  it('reads every supported key', () => {
    const params = parseCatalogParams(
      new URLSearchParams('q=watch&category=wearables&sort=price_asc&page=3&min=1000&max=5000'),
    );
    expect(params).toEqual({
      q: 'watch',
      category: 'wearables',
      sort: 'price_asc',
      page: 3,
      minPrice: 1000,
      maxPrice: 5000,
    });
  });

  it('falls back to defaults for unknown sort and invalid page values', () => {
    const params = parseCatalogParams(new URLSearchParams('sort=cheapest&page=0&min=-5&max=abc'));
    expect(params.sort).toBe('newest');
    expect(params.page).toBe(1);
    expect(params.minPrice).toBeNull();
    expect(params.maxPrice).toBeNull();
  });

  it('trims whitespace from the search term', () => {
    expect(parseCatalogParams(new URLSearchParams('q=%20%20kettle%20')).q).toBe('kettle');
  });
});

describe('serializeCatalogParams', () => {
  it('omits default values so URLs stay short', () => {
    expect(serializeCatalogParams(DEFAULT_CATALOG_PARAMS).toString()).toBe('');
  });

  it('round-trips a full set of params', () => {
    const params = {
      q: 'pen',
      category: 'stationery',
      sort: 'rating' as const,
      page: 2,
      minPrice: 50000,
      maxPrice: 300000,
    };
    expect(parseCatalogParams(serializeCatalogParams(params))).toEqual(params);
  });
});

describe('toListParams', () => {
  it('maps to the API shape with the page size and omits empty filters', () => {
    expect(toListParams(DEFAULT_CATALOG_PARAMS)).toEqual({
      page: 1,
      limit: CATALOG_PAGE_SIZE,
      sort: 'newest',
    });
    expect(toListParams({ ...DEFAULT_CATALOG_PARAMS, q: 'mat', minPrice: 100 })).toEqual({
      page: 1,
      limit: CATALOG_PAGE_SIZE,
      sort: 'newest',
      q: 'mat',
      minPrice: 100,
    });
  });
});

describe('countActiveFilters', () => {
  it('counts category and price range as filters but not search or sort', () => {
    expect(countActiveFilters(DEFAULT_CATALOG_PARAMS)).toBe(0);
    expect(countActiveFilters({ ...DEFAULT_CATALOG_PARAMS, q: 'x', sort: 'name' })).toBe(0);
    expect(countActiveFilters({ ...DEFAULT_CATALOG_PARAMS, category: 'audio', maxPrice: 5 })).toBe(
      2,
    );
  });
});
