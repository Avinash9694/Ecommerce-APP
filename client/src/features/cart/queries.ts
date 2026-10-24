import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { api, errorMessage, isApiError } from '@/api';
import type { Cart, CartProduct } from '@/api';
import { useAuth } from '@/features/auth/use-auth';
import { toast } from '@/store/toast-store';
import { EMPTY_CART, emptied, withItemAdded, withItemQty, withoutItem } from './cart-math';

export const cartKey = ['cart'] as const;

export function useCart() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: cartKey,
    queryFn: () => api.cart.get(),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

interface OptimisticContext {
  previous: Cart | undefined;
}

/** Shared optimistic-update plumbing: apply locally, roll back on error, refetch after. */
function optimistic<TVars>(
  queryClient: QueryClient,
  apply: (cart: Cart, vars: TVars) => Cart,
  onErrorMessage?: (err: unknown, vars: TVars) => string,
) {
  return {
    onMutate: async (vars: TVars): Promise<OptimisticContext> => {
      await queryClient.cancelQueries({ queryKey: cartKey });
      const previous = queryClient.getQueryData<Cart>(cartKey);
      queryClient.setQueryData<Cart>(cartKey, apply(previous ?? EMPTY_CART, vars));
      return { previous };
    },
    onError: (err: unknown, vars: TVars, context: OptimisticContext | undefined) => {
      if (context?.previous) queryClient.setQueryData(cartKey, context.previous);
      toast.error(onErrorMessage ? onErrorMessage(err, vars) : errorMessage(err));
    },
    onSuccess: (cart: Cart) => queryClient.setQueryData(cartKey, cart),
    onSettled: () => queryClient.invalidateQueries({ queryKey: cartKey }),
  };
}

const stockMessage = (err: unknown): string =>
  isApiError(err) && err.code === 'INSUFFICIENT_STOCK' ? err.message : errorMessage(err);

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ product, qty }: { product: CartProduct; qty: number }) =>
      api.cart.add(product.id, qty),
    ...optimistic<{ product: CartProduct; qty: number }>(
      queryClient,
      (cart, { product, qty }) => withItemAdded(cart, product, qty),
      stockMessage,
    ),
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, qty }: { productId: string; qty: number }) =>
      api.cart.update(productId, qty),
    ...optimistic<{ productId: string; qty: number }>(
      queryClient,
      (cart, { productId, qty }) => withItemQty(cart, productId, qty),
      stockMessage,
    ),
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => api.cart.remove(productId),
    ...optimistic<string>(queryClient, (cart, productId) => withoutItem(cart, productId)),
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.cart.clear(),
    ...optimistic<void>(queryClient, (cart) => emptied(cart)),
  });
}
