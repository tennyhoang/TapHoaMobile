import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { warehouseManagerService } from '@/services/warehouse-manager.service';
import { queryKeys } from './queryKeys';
import type {
  WarehouseDashboard,
  WarehouseOrder,
  WarehouseInventoryItem,
  WarehouseDriver,
  PagedResult,
} from '@/types';
import type { UseQueryOptions } from '@tanstack/react-query';

export function useWarehouseDashboard(options?: Partial<UseQueryOptions<WarehouseDashboard>>) {
  return useQuery({
    queryKey: queryKeys.warehouse.dashboard,
    queryFn: () => warehouseManagerService.getDashboard(),
    staleTime: 30_000,
    ...options,
  });
}

export function useWarehouseOrders(
  params?: { status?: 'pending' | 'packed' | 'shipping'; page?: number; pageSize?: number },
  options?: Partial<UseQueryOptions<PagedResult<WarehouseOrder>>>
) {
  return useQuery({
    queryKey: queryKeys.warehouse.orders(params as Record<string, unknown>),
    queryFn: () => warehouseManagerService.getOrders(params),
    staleTime: 15_000,
    ...options,
  });
}

export function useWarehouseInventory(
  params?: { search?: string; filter?: 'low' | 'out' | ''; page?: number; pageSize?: number },
  options?: Partial<UseQueryOptions<PagedResult<WarehouseInventoryItem>>>
) {
  return useQuery({
    queryKey: queryKeys.warehouse.inventory(params as Record<string, unknown>),
    queryFn: () => warehouseManagerService.getInventory(params),
    staleTime: 30_000,
    ...options,
  });
}

export function useWarehouseDrivers(options?: Partial<UseQueryOptions<WarehouseDriver[]>>) {
  return useQuery({
    queryKey: queryKeys.warehouse.drivers,
    queryFn: () => warehouseManagerService.getDrivers(),
    staleTime: 60_000,
    ...options,
  });
}

export function usePackOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => warehouseManagerService.packOrder(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.warehouse.orders() });
      qc.invalidateQueries({ queryKey: queryKeys.warehouse.dashboard });
    },
  });
}

export function usePackBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderIds: string[]) => warehouseManagerService.packBatch(orderIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.warehouse.orders() });
      qc.invalidateQueries({ queryKey: queryKeys.warehouse.dashboard });
    },
  });
}

export function useAdjustStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      delta,
      reason,
    }: {
      productId: string;
      delta: number;
      reason?: string;
    }) => warehouseManagerService.adjustStock(productId, delta, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.warehouse.inventory() });
    },
  });
}
