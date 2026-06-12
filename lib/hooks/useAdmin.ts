import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminService,
  type AdminStats,
  type CategoryPayload,
  type WarehousePayload,
  type CreateFlashSaleSessionPayload,
  type AddFlashSaleItemPayload,
  type UpdateUserPayload,
  type CreateProductPayload,
  type UpdateProductPayload,
} from '@/services/admin.service';
import { queryKeys } from './queryKeys';
import type { Order, OrderStatus, PagedResult } from '@/types';
import type { CreateVoucherPayload, UpdateVoucherPayload } from '@/types';
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

// ── Products ───────────────────────────────────────────────────────────────────

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProductPayload) => adminService.products.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateProductPayload }) =>
      adminService.products.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.products.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}

// ── Categories ─────────────────────────────────────────────────────────────────

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CategoryPayload) => adminService.categories.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.categories.all });
      qc.invalidateQueries({ queryKey: queryKeys.admin.categories });
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CategoryPayload }) =>
      adminService.categories.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.categories.all });
      qc.invalidateQueries({ queryKey: queryKeys.admin.categories });
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.categories.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.categories.all });
      qc.invalidateQueries({ queryKey: queryKeys.admin.categories });
    },
  });
}

// ── Flash Sale ─────────────────────────────────────────────────────────────────

export function useAdminFlashSaleSessions() {
  return useQuery({
    queryKey: queryKeys.admin.flashSale.sessions,
    queryFn: () => adminService.flashSale.getSessions(),
    staleTime: 30_000,
  });
}

export function useCreateFlashSaleSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFlashSaleSessionPayload) =>
      adminService.flashSale.createSession(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.flashSale.sessions });
      qc.invalidateQueries({ queryKey: queryKeys.flashSale.current });
    },
  });
}

export function useToggleFlashSaleSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.flashSale.toggleSession(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.flashSale.sessions });
      qc.invalidateQueries({ queryKey: queryKeys.flashSale.current });
    },
  });
}

export function useDeleteFlashSaleSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.flashSale.deleteSession(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.flashSale.sessions });
    },
  });
}

export function useAddFlashSaleItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, payload }: { sessionId: string; payload: AddFlashSaleItemPayload }) =>
      adminService.flashSale.addItem(sessionId, payload),
    onSuccess: (_data, { sessionId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.flashSale.items(sessionId) });
    },
  });
}

export function useRemoveFlashSaleItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, itemId }: { sessionId: string; itemId: string }) =>
      adminService.flashSale.removeItem(sessionId, itemId),
    onSuccess: (_data, { sessionId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.flashSale.items(sessionId) });
    },
  });
}

// ── Users ──────────────────────────────────────────────────────────────────────

export function useAdminUsers(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
}) {
  return useQuery({
    queryKey: queryKeys.admin.users(params as Record<string, unknown>),
    queryFn: () => adminService.users.getAll(params),
    staleTime: 30_000,
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      adminService.users.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.users() });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.users.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.users() });
    },
  });
}

export function useAssignWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      warehouseId,
      targetType,
    }: {
      userId: string;
      warehouseId: string | null;
      targetType: 'Driver' | 'Manager';
    }) => adminService.users.assignWarehouse(userId, warehouseId, targetType),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.users() });
    },
  });
}

// ── Warehouses ─────────────────────────────────────────────────────────────────

export function useAdminWarehouses() {
  return useQuery({
    queryKey: queryKeys.admin.warehouses,
    queryFn: () => adminService.warehouses.getAll(),
    staleTime: 60_000,
  });
}

export function useCreateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: WarehousePayload) => adminService.warehouses.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.warehouses });
    },
  });
}

export function useUpdateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: WarehousePayload }) =>
      adminService.warehouses.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.warehouses });
    },
  });
}

export function useToggleWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.warehouses.toggle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.warehouses });
    },
  });
}

export function useDeleteWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.warehouses.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.warehouses });
    },
  });
}

// ── Wallet / Withdraw ──────────────────────────────────────────────────────────

export function useAdminWithdrawRequests(status: 'Pending' | 'Completed' | 'Rejected') {
  return useQuery({
    queryKey: queryKeys.admin.wallet(status),
    queryFn: () => adminService.wallet.getWithdrawRequests(status),
    staleTime: 15_000,
  });
}

export function useCompleteWithdraw() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string | null }) =>
      adminService.wallet.completeWithdraw(id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.wallet('Pending') });
      qc.invalidateQueries({ queryKey: queryKeys.admin.wallet('Completed') });
    },
  });
}

// ── Vouchers ───────────────────────────────────────────────────────────────────

export function useAdminVouchers() {
  return useQuery({
    queryKey: queryKeys.admin.vouchers.all,
    queryFn: () => adminService.vouchers.getAll(),
    staleTime: 30_000,
  });
}

export function useCreateVoucher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateVoucherPayload) => adminService.vouchers.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.vouchers.all });
    },
  });
}

export function useUpdateVoucher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateVoucherPayload }) =>
      adminService.vouchers.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.vouchers.all });
    },
  });
}

export function useDeleteVoucher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.vouchers.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.vouchers.all });
    },
  });
}

export function useRejectWithdraw() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string | null }) =>
      adminService.wallet.rejectWithdraw(id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.wallet('Pending') });
      qc.invalidateQueries({ queryKey: queryKeys.admin.wallet('Rejected') });
    },
  });
}
