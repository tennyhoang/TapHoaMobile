import { api } from '@/lib/api';
import type { Review, PagedResult } from '@/types';

export const reviewsService = {
  getByProduct: (productId: string, page = 1, pageSize = 20): Promise<PagedResult<Review>> =>
    api.get<PagedResult<Review>>(
      `/products/${productId}/reviews?page=${page}&pageSize=${pageSize}`
    ),

  submit: (productId: string, payload: { rating: number; comment?: string }): Promise<Review> =>
    api.post<Review>(`/products/${productId}/reviews`, payload),
};
