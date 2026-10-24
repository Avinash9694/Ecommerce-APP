import { useNavigate } from 'react-router-dom';
import { useCartUiStore } from '@/store/cart-ui-store';
import { useCart } from '@/features/cart/queries';
import { useAuth } from '@/features/auth/use-auth';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { LineSkeleton } from '@/components/ui/skeleton';
import { CartIcon } from '@/components/ui/icons';
import { CartLine } from './cart-line';
import { CartSummary } from './cart-summary';

export function CartDrawer() {
  const isOpen = useCartUiStore((s) => s.isDrawerOpen);
  const close = useCartUiStore((s) => s.closeDrawer);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const cart = useCart();

  const go = (to: string) => {
    close();
    navigate(to);
  };

  const items = cart.data?.items ?? [];

  return (
    <Dialog open={isOpen} onClose={close} title="Your cart" variant="panel">
      {!isAuthenticated ? (
        <EmptyState
          icon={<CartIcon size={24} />}
          title="Sign in to see your cart"
          description="Your cart is saved to your account so it follows you between devices."
          action={<Button onClick={() => go('/login')}>Sign in</Button>}
        />
      ) : cart.isPending ? (
        <LineSkeleton lines={4} />
      ) : cart.isError ? (
        <ErrorState error={cart.error} onRetry={() => cart.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<CartIcon size={24} />}
          title="Your cart is empty"
          description="Browse the catalog and add something you like."
          action={<Button onClick={() => go('/catalog')}>Browse products</Button>}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <ul className="divide-y divide-line">
            {items.map((item) => (
              <CartLine key={item.product.id} item={item} compact onNavigate={close} />
            ))}
          </ul>
          <div className="rounded-xl border border-line bg-surface-2 p-4">
            <CartSummary totals={cart.data.totals} itemCount={cart.data.itemCount} />
          </div>
          <div className="flex flex-col gap-2">
            <Button size="lg" onClick={() => go('/checkout')}>
              Checkout
            </Button>
            <Button variant="ghost" onClick={() => go('/cart')}>
              View full cart
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
