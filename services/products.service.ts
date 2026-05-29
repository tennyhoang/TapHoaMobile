import { api } from '@/lib/api';
import type { PagedResult, Product } from '@/types';

type ProductsParams = {
  search?: string;
  categoryId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  isNew?: boolean;
  isDiscount?: boolean;
};

export const productsService = {
  getAll: (params: ProductsParams = {}): Promise<PagedResult<Product>> => {
    const q = new URLSearchParams();
    if (params.search) q.set('search', params.search);
    if (params.categoryId) q.set('categoryId', params.categoryId);
    if (params.page) q.set('page', String(params.page));
    if (params.pageSize) q.set('pageSize', String(params.pageSize));
    if (params.sortBy) q.set('sortBy', params.sortBy);
    if (params.isNew != null) q.set('isNew', String(params.isNew));
    if (params.isDiscount != null) q.set('isDiscount', String(params.isDiscount));
    const qs = q.toString();
    return api.get<PagedResult<Product>>(`/products${qs ? `?${qs}` : ''}`);
  },

  getById: (id: string): Promise<Product> => api.get<Product>(`/products/${id}`),
};
