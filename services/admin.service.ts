import { api } from '@/lib/api';
import type { Order, OrderStatus, PagedResult } from '@/types';

export type AdminStats = {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  totalUsers: number;
};

export const adminService = {
  getStats: (): Promise<AdminStats> => api.get('/admin/stats'),

  getOrders: (params?: {
    page?: number;
    pageSize?: number;
    status?: OrderStatus;
  }): Promise<PagedResult<Order>> => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.pageSize) qs.set('pageSize', String(params.pageSize));
    if (params?.status) qs.set('status', params.status);
    return api.get(`/admin/orders${qs.toString() ? `?${qs}` : ''}`);
  },

  updateOrderStatus: (id: string, status: OrderStatus): Promise<Order> =>
    api.patch(`/admin/orders/${id}/status`, { status }),
};
