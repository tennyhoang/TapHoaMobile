import { api } from '@/lib/api';
import type { Order, OrderStatus, PagedResult } from '@/types';

export const agentService = {
  getOrders: (status: OrderStatus): Promise<PagedResult<Order>> =>
    api.get<PagedResult<Order>>(`/agent/orders?status=${status}&page=1&pageSize=50`),

  arrive: (orderId: string): Promise<Order> => api.patch<Order>(`/agent/orders/${orderId}/arrive`),

  completePickup: (orderId: string): Promise<Order> =>
    api.patch<Order>(`/agent/orders/${orderId}/complete-pickup`),
};
