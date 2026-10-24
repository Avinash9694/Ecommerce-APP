import catalog from '@catalog';
import type { Category, Product } from '../types';

interface CatalogProduct {
  name: string;
  slug: string;
  category: string;
  price: number;
  stock: number;
  featured: boolean;
  rating: { average: number; count: number };
  tags: string[];
  description: string;
}

interface CatalogCategory {
  name: string;
  slug: string;
  description: string;
  image: string;
}

const typed = catalog as { categories: CatalogCategory[]; products: CatalogProduct[] };

export const categoryId = (slug: string): string => `c-${slug}`;
export const productId = (slug: string): string => `p-${slug}`;

export function buildCategories(): Category[] {
  return typed.categories.map((c) => ({ id: categoryId(c.slug), ...c }));
}

// Spreads createdAt across the catalog so "newest" is a stable, meaningful order.
export function buildProducts(now = Date.UTC(2026, 0, 1)): Product[] {
  const byCategory = new Map(typed.categories.map((c) => [c.slug, c]));
  return typed.products.map((p, index) => {
    const category = byCategory.get(p.category);
    if (!category) throw new Error(`Unknown category ${p.category} for ${p.slug}`);
    return {
      id: productId(p.slug),
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      currency: 'INR',
      images: [`products/${p.slug}-1.svg`, `products/${p.slug}-2.svg`],
      category: { id: categoryId(category.slug), name: category.name, slug: category.slug },
      stock: p.stock,
      rating: p.rating,
      tags: p.tags,
      featured: p.featured,
      createdAt: new Date(now - index * 36e5).toISOString(),
    };
  });
}
