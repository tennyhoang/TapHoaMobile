import { useQuery } from '@tanstack/react-query';
import { flashSaleService } from '@/services/flashsale.service';
import { queryKeys } from './queryKeys';
import type { FlashSaleSession } from '@/types';
import type { UseQueryOptions } from '@tanstack/react-query';

export function useCurrentFlashSale(options?: Partial<UseQueryOptions<FlashSaleSession | null>>) {
  return useQuery({
    queryKey: queryKeys.flashSale.current,
    queryFn: () => flashSaleService.getCurrent(),
    staleTime: 30_000,
    refetchInterval: 60_000,
    ...options,
  });
}
