import { useQuery, useMutation } from '@tanstack/react-query';
import { productsService } from '@/services/products.service';
import { cartService } from '@/services/cart.service';
import { queryKeys } from './queryKeys';
import type { PagedResult, Product } from '@/types';
import type { UseQueryOptions } from '@tanstack/react-query';

type ProductsParams = {
  search?: string;
  categoryId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  isNew?: boolean;
  isDiscount?: boolean;
};

export function useProducts(
  params: ProductsParams = {},
  options?: Partial<UseQueryOptions<PagedResult<Product>>>
) {
  return useQuery({
    queryKey: queryKeys.products.list(params as Record<string, unknown>),
    queryFn: () => productsService.getAll(params),
    staleTime: 30_000,
    ...options,
  });
}

export function useProduct(id: string, options?: Partial<UseQueryOptions<Product>>) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => productsService.getById(id),
    enabled: !!id,
    staleTime: 60_000,
    ...options,
  });
}

export function useAddToCart() {
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      cartService.add(productId, quantity),
  });
}

export function useUpdateCartItem() {
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      cartService.update(productId, quantity),
  });
}

export function useRemoveFromCart() {
  return useMutation({
    mutationFn: (productId: string) => cartService.remove(productId),
  });
}

export function useClearCart() {
  return useMutation({
    mutationFn: () => cartService.clear(),
  });
}
