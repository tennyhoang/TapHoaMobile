import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentService } from '@/services/agent.service';
import { queryKeys } from './queryKeys';
import type { Order, OrderStatus, PagedResult } from '@/types';
import type { UseQueryOptions } from '@tanstack/react-query';

export function useAgentOrders(
  status: OrderStatus,
  options?: Partial<UseQueryOptions<PagedResult<Order>>>
) {
  return useQuery({
    queryKey: queryKeys.agent.orders(status),
    queryFn: () => agentService.getOrders(status),
    staleTime: 15_000,
    ...options,
  });
}

export function useArriveOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => agentService.arrive(orderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent'] });
    },
  });
}

export function useCompletePickup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => agentService.completePickup(orderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent'] });
    },
  });
}
