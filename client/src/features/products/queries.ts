import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api';
import type { ProductInput, ProductListParams } from '@/api';
import { categoriesKey } from '@/features/categories/queries';

export const productsKey = (params: ProductListParams = {}) => ['products', params] as const;
export const productKey = (slug: string) => ['product', slug] as const;

export function useProducts(params: ProductListParams = {}) {
  return useQuery({
    queryKey: productsKey(params),
    queryFn: () => api.products.list(params),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

export function useProduct(slug: string | undefined) {
  return useQuery({
    queryKey: productKey(slug ?? ''),
    queryFn: () => api.products.getBySlug(slug as string),
    enabled: Boolean(slug),
    staleTime: 60_000,
  });
}

export function useRelatedProducts(
  categorySlug: string | undefined,
  excludeId: string | undefined,
) {
  const query = useProducts(categorySlug ? { category: categorySlug, limit: 5 } : {});
  const items = (query.data?.items ?? []).filter((p) => p.id !== excludeId).slice(0, 4);
  return { ...query, items };
}

function useInvalidateProducts() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['products'] }),
      queryClient.invalidateQueries({ queryKey: ['product'] }),
      queryClient.invalidateQueries({ queryKey: categoriesKey }),
    ]);
}

export function useCreateProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (input: ProductInput) => api.products.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdateProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ProductInput> }) =>
      api.products.update(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (id: string) => api.products.remove(id),
    onSuccess: invalidate,
  });
}
