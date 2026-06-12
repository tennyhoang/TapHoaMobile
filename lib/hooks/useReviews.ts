import { useQuery } from '@tanstack/react-query';
import { reviewsService } from '@/services/reviews.service';
import { queryKeys } from './queryKeys';
import type { Review, PagedResult } from '@/types';
import type { UseQueryOptions } from '@tanstack/react-query';

export function useProductReviews(
  productId: string,
  page = 1,
  options?: Partial<UseQueryOptions<PagedResult<Review>>>
) {
  return useQuery({
    queryKey: queryKeys.reviews.byProduct(productId, page),
    queryFn: () => reviewsService.getByProduct(productId, page),
    enabled: !!productId,
    staleTime: 30_000,
    ...options,
  });
}
