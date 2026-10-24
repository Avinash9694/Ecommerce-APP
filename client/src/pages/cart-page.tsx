import { useCart, useClearCart } from '@/features/cart/queries';
import { CartLine } from '@/components/cart/cart-line';
import { CartSummary } from '@/components/cart/cart-summary';
import { Button, LinkButton } from '@/components/ui/button';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { LineSkeleton } from '@/components/ui/skeleton';
import { CartIcon } from '@/components/ui/icons';

export function CartPage() {
  const cart = useCart();
  const clear = useClearCart();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Your cart</h1>
      {cart.isPending ? (
        <LineSkeleton lines={5} />
      ) : cart.isError ? (
        <ErrorState error={cart.error} onRetry={() => cart.refetch()} />
      ) : cart.data.items.length === 0 ? (
        <EmptyState
          icon={<CartIcon size={24} />}
          title="Your cart is empty"
          description="Browse the catalog and add something you like."
          action={<LinkButton to="/catalog">Browse products</LinkButton>}
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <section
            aria-label="Cart items"
            className="rounded-xl border border-line bg-surface px-4"
          >
            <ul className="divide-y divide-line">
              {cart.data.items.map((item) => (
                <CartLine key={item.product.id} item={item} />
              ))}
            </ul>
            <div className="flex justify-end border-t border-line py-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clear.mutate()}
                isLoading={clear.isPending}
              >
                Clear cart
              </Button>
            </div>
          </section>
          <aside
            aria-label="Order summary"
            className="h-fit rounded-xl border border-line bg-surface p-5 lg:sticky lg:top-24"
          >
            <h2 className="mb-4 text-lg font-semibold">Summary</h2>
            <CartSummary totals={cart.data.totals} itemCount={cart.data.itemCount} />
            <LinkButton to="/checkout" size="lg" className="mt-5 w-full">
              Proceed to checkout
            </LinkButton>
            <LinkButton to="/catalog" variant="ghost" className="mt-2 w-full">
              Continue shopping
            </LinkButton>
          </aside>
        </div>
      )}
    </div>
  );
}
