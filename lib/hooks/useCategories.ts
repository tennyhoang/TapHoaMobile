import { useQuery } from '@tanstack/react-query';
import { categoriesService } from '@/services/categories.service';
import { queryKeys } from './queryKeys';
import type { Category } from '@/types';
import type { UseQueryOptions } from '@tanstack/react-query';

export function useCategories(options?: Partial<UseQueryOptions<Category[]>>) {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => categoriesService.getAll(),
    staleTime: 120_000,
    ...options,
  });
}
