import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api';
import type { CreateOrderInput, OrderListParams, OrderStatus, PayOrderInput } from '@/api';
import { useAuth } from '@/features/auth/use-auth';
import { cartKey } from '@/features/cart/queries';

export const myOrdersKey = ['orders', 'mine'] as const;
export const orderKey = (id: string) => ['orders', 'mine', id] as const;
export const adminOrdersKey = (params: OrderListParams = {}) =>
  ['admin', 'orders', params] as const;

export function useMyOrders() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: myOrdersKey,
    queryFn: () => api.orders.listMine(),
    enabled: isAuthenticated,
  });
}

export function useOrder(id: string | undefined) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: orderKey(id ?? ''),
    queryFn: () => api.orders.getMine(id as string),
    enabled: isAuthenticated && Boolean(id),
  });
}

function useInvalidateOrders() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['orders'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] }),
      queryClient.invalidateQueries({ queryKey: ['products'] }),
      queryClient.invalidateQueries({ queryKey: ['product'] }),
    ]);
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: (input: CreateOrderInput) => api.orders.create(input),
    onSuccess: async (order) => {
      queryClient.setQueryData(orderKey(order.id), order);
      await Promise.all([invalidate(), queryClient.invalidateQueries({ queryKey: cartKey })]);
    },
  });
}

export function usePayOrder() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input?: PayOrderInput }) => api.orders.pay(id, input),
    onSuccess: (order) => {
      queryClient.setQueryData(orderKey(order.id), order);
      return invalidate();
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: (id: string) => api.orders.cancel(id),
    onSuccess: (order) => {
      queryClient.setQueryData(orderKey(order.id), order);
      return invalidate();
    },
  });
}

export function useAdminOrders(params: OrderListParams = {}) {
  const { isAdmin } = useAuth();
  return useQuery({
    queryKey: adminOrdersKey(params),
    queryFn: () => api.orders.adminList(params),
    enabled: isAdmin,
    placeholderData: keepPreviousData,
  });
}

export function useUpdateOrderStatus() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      api.orders.adminUpdateStatus(id, status),
    onSuccess: invalidate,
  });
}
