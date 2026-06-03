import { useQuery } from '@tanstack/react-query';
import { cartService } from '@/services/cart.service';
import { queryKeys } from './queryKeys';
import type { Cart } from '@/types';
import type { UseQueryOptions } from '@tanstack/react-query';

export function useCart(options?: Partial<UseQueryOptions<Cart>>) {
  return useQuery({
    queryKey: queryKeys.cart.all,
    queryFn: () => cartService.get(),
    staleTime: 10_000,
    ...options,
  });
}
