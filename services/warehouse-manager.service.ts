import { api } from '@/lib/api';
import type {
  WarehouseDashboard,
  WarehouseOrder,
  WarehouseInventoryItem,
  WarehouseDriver,
  PagedResult,
} from '@/types';

export const warehouseManagerService = {
  getDashboard: (): Promise<WarehouseDashboard> => api.get('/warehouse-manager/dashboard'),

  getOrders: (params?: {
    status?: 'pending' | 'packed' | 'shipping';
    page?: number;
    pageSize?: number;
  }): Promise<PagedResult<WarehouseOrder>> => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.pageSize) qs.set('pageSize', String(params.pageSize));
    return api.get(`/warehouse-manager/orders${qs.toString() ? `?${qs}` : ''}`);
  },

  packOrder: (id: string): Promise<{ id: string; status: string; packedAtWarehouseAt: string }> =>
    api.patch(`/warehouse-manager/orders/${id}/pack`, {}),

  packBatch: (orderIds: string[]): Promise<{ packed: number; errors: string[] }> =>
    api.patch('/warehouse-manager/orders/pack-batch', { orderIds }),

  getInventory: (params?: {
    search?: string;
    filter?: 'low' | 'out' | '';
    page?: number;
    pageSize?: number;
  }): Promise<PagedResult<WarehouseInventoryItem>> => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.filter) qs.set('filter', params.filter);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.pageSize) qs.set('pageSize', String(params.pageSize));
    return api.get(`/warehouse-manager/inventory${qs.toString() ? `?${qs}` : ''}`);
  },

  adjustStock: (
    productId: string,
    delta: number,
    reason?: string
  ): Promise<{ id: string; name: string; stock: number }> =>
    api.patch(`/warehouse-manager/inventory/${productId}/adjust`, { delta, reason }),

  getDrivers: (): Promise<WarehouseDriver[]> => api.get('/warehouse-manager/drivers'),
};
