import { api } from '@/lib/api';
import type { Order, OrderStatus, PagedResult } from '@/types';

type CreateOrderPayload = {
  hubId: string;
  note?: string;
  paymentMethod?: 'COD' | 'BankTransfer' | 'Wallet';
  useWallet?: boolean;
  voucherCode?: string;
};

export const ordersService = {
  getMyOrders: (params?: {
    page?: number;
    pageSize?: number;
    status?: OrderStatus;
  }): Promise<PagedResult<Order>> => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.pageSize) qs.set('pageSize', String(params.pageSize));
    if (params?.status) qs.set('status', params.status);
    return api.get(`/orders/my${qs.toString() ? `?${qs}` : ''}`);
  },

  getById: (id: string): Promise<Order> => api.get(`/orders/${id}`),

  create: (payload: CreateOrderPayload): Promise<Order> => api.post('/orders', payload),

  cancel: (id: string, cancelReason?: string): Promise<Order> =>
    api.patch(`/orders/${id}/cancel`, { cancelReason }),

  requestRefund: (id: string, reason: string): Promise<Order> =>
    api.patch(`/orders/${id}/refund`, { reason }),
};
