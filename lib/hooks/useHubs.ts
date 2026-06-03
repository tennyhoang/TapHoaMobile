import { useQuery } from '@tanstack/react-query';
import { hubsService } from '@/services/hubs.service';
import { queryKeys } from './queryKeys';
import type { Hub } from '@/types';
import type { UseQueryOptions } from '@tanstack/react-query';

export function useActiveHubs(
  city?: string,
  district?: string,
  options?: Partial<UseQueryOptions<Hub[]>>
) {
  return useQuery({
    queryKey: queryKeys.hubs.active(city, district),
    queryFn: () => hubsService.getActive(city, district),
    staleTime: 120_000,
    ...options,
  });
}
