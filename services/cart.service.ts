import { api } from '@/lib/api';
import type { Cart } from '@/types';

export const cartService = {
  get: (): Promise<Cart> => api.get<Cart>('/cart'),

  add: (productId: string, quantity: number): Promise<Cart> =>
    api.post<Cart>('/cart', { productId, quantity }),

  update: (productId: string, quantity: number): Promise<Cart> =>
    api.put<Cart>(`/cart/${productId}`, { quantity }),

  remove: (productId: string): Promise<Cart> => api.delete<Cart>(`/cart/${productId}`),

  clear: (): Promise<void> => api.delete<void>('/cart'),
};
