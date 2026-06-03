import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driverService } from '@/services/driver.service';
import { queryKeys } from './queryKeys';
import type { AssignedWarehouseDto, DriverHubBatch, Order, PagedResult } from '@/types';
import type { UseQueryOptions } from '@tanstack/react-query';

export function useDriverWarehouse(options?: Partial<UseQueryOptions<AssignedWarehouseDto>>) {
  return useQuery({
    queryKey: queryKeys.driver.warehouse,
    queryFn: () => driverService.getMyWarehouse(),
    staleTime: 60_000,
    retry: false,
    ...options,
  });
}

export function useDriverOrders(options?: Partial<UseQueryOptions<DriverHubBatch[]>>) {
  return useQuery({
    queryKey: queryKeys.driver.orders,
    queryFn: () => driverService.getOrders(),
    staleTime: 15_000,
    ...options,
  });
}

export function useDriverShippingOrders(options?: Partial<UseQueryOptions<PagedResult<Order>>>) {
  return useQuery({
    queryKey: queryKeys.driver.shipping,
    queryFn: () => driverService.getShippingOrders(),
    staleTime: 15_000,
    ...options,
  });
}

export function useDriverCompletedOrders(options?: Partial<UseQueryOptions<PagedResult<Order>>>) {
  return useQuery({
    queryKey: queryKeys.driver.completed,
    queryFn: () => driverService.getCompletedOrders(),
    staleTime: 30_000,
    ...options,
  });
}

export function usePickupOrders() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderIds: string[]) => driverService.pickupOrders(orderIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.driver.orders });
      qc.invalidateQueries({ queryKey: queryKeys.driver.shipping });
    },
  });
}

export function useOptimizeRoute() {
  return useMutation({
    mutationFn: (addresses: string[]) => driverService.optimizeRoute(addresses),
  });
}
