import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, type AdminStats } from '@/services/admin.service';
import { queryKeys } from './queryKeys';
import type { Order, OrderStatus, PagedResult } from '@/types';
import type { UseQueryOptions } from '@tanstack/react-query';

export function useAdminStats(options?: Partial<UseQueryOptions<AdminStats>>) {
  return useQuery({
    queryKey: queryKeys.admin.stats,
    queryFn: () => adminService.getStats(),
    staleTime: 30_000,
    ...options,
  });
}

export function useAdminOrders(
  params?: { page?: number; pageSize?: number; status?: OrderStatus },
  options?: Partial<UseQueryOptions<PagedResult<Order>>>
) {
  return useQuery({
    queryKey: queryKeys.admin.orders(params as Record<string, unknown>),
    queryFn: () => adminService.getOrders(params),
    staleTime: 15_000,
    ...options,
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      adminService.updateOrderStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.orders() });
      qc.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}
