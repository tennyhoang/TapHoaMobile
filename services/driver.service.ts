import { api } from '@/lib/api';
import type {
  DriverHubBatch,
  OptimizeRouteResponse,
  AssignedWarehouseDto,
  PagedResult,
  Order,
} from '@/types';

export const driverService = {
  getMyWarehouse: (): Promise<AssignedWarehouseDto> =>
    api.get<AssignedWarehouseDto>('/driver/me/warehouse'),

  getOrders: (): Promise<DriverHubBatch[]> => api.get<DriverHubBatch[]>('/driver/orders'),

  getShippingOrders: (): Promise<PagedResult<Order>> =>
    api.get<PagedResult<Order>>('/driver/orders/shipping?pageSize=50'),

  getCompletedOrders: (): Promise<PagedResult<Order>> =>
    api.get<PagedResult<Order>>('/driver/orders/delivered?pageSize=30'),

  pickupOrders: (orderIds: string[]): Promise<{ shipped: number; errors: string[] }> =>
    api.patch('/driver/orders/pickup-from-warehouse', { orderIds }),

  optimizeRoute: (orderAddresses: string[]): Promise<OptimizeRouteResponse> =>
    api.post<OptimizeRouteResponse>('/driver/optimize-route', { orderAddresses }),

  deliverOrder: (orderId: string, deliveryPhotoUrl: string): Promise<Order> =>
    api.post<Order>(`/driver/orders/${orderId}/deliver`, { deliveryPhotoUrl }),
};
