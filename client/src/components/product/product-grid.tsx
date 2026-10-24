import type { Product } from '@/api';
import { ProductCard } from './product-card';

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4"
      aria-label="Products"
    >
      {products.map((product) => (
        <li key={product.id} className="min-w-0">
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
