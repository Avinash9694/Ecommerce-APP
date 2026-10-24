import { useNavigate, useLocation } from 'react-router-dom';
import type { CartProduct } from '@/api';
import { useAuth } from '@/features/auth/use-auth';
import { useAddToCart, useCart } from '@/features/cart/queries';
import { useCartUiStore } from '@/store/cart-ui-store';
import { toast } from '@/store/toast-store';
import { Button } from '@/components/ui/button';
import type { ButtonProps } from '@/components/ui/button';
import { CartIcon } from '@/components/ui/icons';

interface AddToCartButtonProps extends Omit<ButtonProps, 'onClick' | 'children'> {
  product: CartProduct;
  qty?: number;
  label?: string;
  openDrawer?: boolean;
}

export function AddToCartButton({
  product,
  qty = 1,
  label = 'Add to cart',
  openDrawer = true,
  ...props
}: AddToCartButtonProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const addToCart = useAddToCart();
  const cart = useCart();
  const openCart = useCartUiStore((s) => s.openDrawer);

  const inCart = cart.data?.items.find((i) => i.product.id === product.id)?.qty ?? 0;
  const soldOut = product.stock <= 0;
  const maxed = inCart + qty > product.stock;

  const handleClick = () => {
    if (!isAuthenticated) {
      toast.info('Sign in to add items to your cart');
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }
    if (maxed) {
      toast.error(`Only ${product.stock} of "${product.name}" available`);
      return;
    }
    addToCart.mutate(
      { product, qty },
      {
        onSuccess: () => {
          toast.success(`Added ${product.name} to your cart`);
          if (openDrawer) openCart();
        },
      },
    );
  };

  return (
    <Button
      onClick={handleClick}
      isLoading={addToCart.isPending}
      disabled={soldOut}
      leadingIcon={<CartIcon size={18} />}
      aria-label={`${label}: ${product.name}`}
      {...props}
    >
      {soldOut ? 'Sold out' : label}
    </Button>
  );
}
