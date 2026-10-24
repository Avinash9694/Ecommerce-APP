import { Link } from 'react-router-dom';
import { useCategories } from '@/features/categories/queries';
import { useProducts } from '@/features/products/queries';
import { ProductGrid } from '@/components/product/product-grid';
import { ProductGridSkeleton, Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { SectionHeading } from '@/components/ui/section-heading';
import { LinkButton } from '@/components/ui/button';
import { ProductImage } from '@/components/ui/product-image';
import { ArrowRightIcon, RefreshIcon, ShieldIcon, TruckIcon } from '@/components/ui/icons';

const PERKS = [
  {
    icon: TruckIcon,
    title: 'Free shipping over ₹999',
    text: 'Flat ₹49 below that, delivered in 3–5 days.',
  },
  {
    icon: RefreshIcon,
    title: '30-day returns',
    text: 'Changed your mind? Send it back, no questions.',
  },
  {
    icon: ShieldIcon,
    title: 'Secure checkout',
    text: 'Payments are mocked here, but the flow is the real one.',
  },
];

export function HomePage() {
  const categories = useCategories();
  const featured = useProducts({ featured: true, limit: 8, sort: 'rating' });

  return (
    <div className="flex flex-col gap-14">
      <section className="grid items-center gap-8 rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-10 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">New season</p>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Everyday essentials, <span className="text-accent">made well.</span>
          </h1>
          <p className="max-w-md text-base text-ink-muted sm:text-lg">
            Audio, wearables, kitchen and carry gear chosen for how they hold up after the first
            month, not the first unboxing.
          </p>
          <div className="flex flex-wrap gap-3">
            <LinkButton to="/catalog" size="lg" className="w-full sm:w-auto">
              Shop the catalog
              <ArrowRightIcon size={18} />
            </LinkButton>
            <LinkButton
              to="/catalog?sort=rating"
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
            >
              Top rated
            </LinkButton>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(categories.data ?? []).slice(0, 3).map((category, index) => (
            <Link
              key={category.id}
              to={`/catalog?category=${category.slug}`}
              className={`group relative overflow-hidden rounded-xl bg-surface-2 ${index === 0 ? 'row-span-2 aspect-[3/4]' : 'aspect-[4/3]'}`}
            >
              <ProductImage
                src={category.image}
                alt=""
                className="transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute bottom-2 left-2 rounded-lg bg-surface/90 px-2.5 py-1 text-xs font-medium backdrop-blur">
                {category.name}
              </span>
            </Link>
          ))}
          {categories.isPending &&
            Array.from({ length: 3 }, (_, i) => (
              <Skeleton
                key={i}
                className={
                  i === 0 ? 'row-span-2 aspect-[3/4] rounded-xl' : 'aspect-[4/3] rounded-xl'
                }
              />
            ))}
        </div>
      </section>

      <section aria-labelledby="categories-heading">
        <SectionHeading
          eyebrow="Browse"
          title="Shop by category"
          link={{ to: '/catalog', label: 'View all products' }}
        />
        {categories.isError ? (
          <ErrorState error={categories.error} onRetry={() => categories.refetch()} />
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {(categories.data ?? Array.from({ length: 6 }, () => null)).map((category, index) =>
              category ? (
                <li key={category.id}>
                  <Link
                    to={`/catalog?category=${category.slug}`}
                    className="group flex flex-col gap-2 rounded-xl border border-line bg-surface p-3 shadow-card transition-shadow hover:shadow-pop"
                  >
                    <span className="aspect-square overflow-hidden rounded-lg bg-surface-2">
                      <ProductImage
                        src={category.image}
                        alt=""
                        className="transition-transform duration-300 group-hover:scale-105"
                      />
                    </span>
                    <span className="text-sm font-medium">{category.name}</span>
                    <span className="text-xs text-ink-muted">
                      {category.productCount ?? 0} products
                    </span>
                  </Link>
                </li>
              ) : (
                <li key={index}>
                  <Skeleton className="aspect-[4/5] rounded-xl" />
                </li>
              ),
            )}
          </ul>
        )}
      </section>

      <section aria-labelledby="featured-heading">
        <SectionHeading
          eyebrow="Picked for you"
          title="Featured products"
          link={{ to: '/catalog?sort=rating', label: 'See top rated' }}
        />
        {featured.isPending ? (
          <ProductGridSkeleton count={8} />
        ) : featured.isError ? (
          <ErrorState error={featured.error} onRetry={() => featured.refetch()} />
        ) : (
          <ProductGrid products={featured.data.items} />
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-3" aria-label="Why shop with us">
        {PERKS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex gap-3 rounded-xl border border-line bg-surface p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-soft-fg">
              <Icon size={20} />
            </span>
            <div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="mt-0.5 text-sm text-ink-muted">{text}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
