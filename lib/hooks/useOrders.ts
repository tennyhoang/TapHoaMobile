import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersService } from '@/services/orders.service';
import { queryKeys } from './queryKeys';
import type { Order, OrderStatus, PagedResult } from '@/types';
import type { UseQueryOptions } from '@tanstack/react-query';

type OrdersParams = {
  page?: number;
  pageSize?: number;
  status?: OrderStatus;
};

export function useMyOrders(
  params: OrdersParams = {},
  options?: Partial<UseQueryOptions<PagedResult<Order>>>
) {
  return useQuery({
    queryKey: queryKeys.orders.my(params as Record<string, unknown>),
    queryFn: () => ordersService.getMyOrders(params),
    staleTime: 15_000,
    ...options,
  });
}

export function useOrder(id: string, options?: Partial<UseQueryOptions<Order>>) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => ordersService.getById(id),
    enabled: !!id,
    staleTime: 30_000,
    ...options,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ordersService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      ordersService.cancel(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}

export function useRequestRefund() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      ordersService.requestRefund(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}
