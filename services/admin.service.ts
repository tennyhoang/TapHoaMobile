import { api } from '@/lib/api';
import type {
  Order,
  OrderStatus,
  PagedResult,
  AdminUser,
  AdminFlashSaleSession,
  AdminFlashSaleItem,
  WithdrawRequest,
  Warehouse,
  Category,
  Product,
  AdminVoucher,
  CreateVoucherPayload,
  UpdateVoucherPayload,
} from '@/types';

export type AdminStats = {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  totalUsers: number;
};

export type CategoryPayload = {
  name: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
};

export type WarehousePayload = {
  name: string;
  address: string;
  ward: string;
  district: string;
  province: string;
  phoneNumber?: string;
};

export type CreateFlashSaleSessionPayload = {
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

export type AddFlashSaleItemPayload = {
  productId: string;
  flashSalePrice: number;
  flashSaleStock: number;
};

export type UpdateUserPayload = {
  fullName?: string;
  phoneNumber?: string;
  role?: string;
  isActive?: boolean;
};

export type CreateProductPayload = {
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  stock: number;
  categoryId: string;
  thumbnailUrl?: string;
};

export type UpdateProductPayload = Partial<CreateProductPayload>;

export const adminService = {
  // ── Dashboard ──────────────────────────────────────────────────────────────
  getStats: (): Promise<AdminStats> => api.get('/admin/stats'),

  // ── Orders ─────────────────────────────────────────────────────────────────
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

  getOrderById: (id: string): Promise<Order> => api.get(`/admin/orders/${id}`),

  updateOrderStatus: (id: string, status: OrderStatus): Promise<Order> =>
    api.patch(`/admin/orders/${id}/status`, { status }),

  // ── Categories ─────────────────────────────────────────────────────────────
  categories: {
    getAll: (): Promise<Category[]> => api.get('/categories'),

    create: (payload: CategoryPayload): Promise<Category> => api.post('/categories', payload),

    update: (id: string, payload: CategoryPayload): Promise<Category> =>
      api.put(`/categories/${id}`, payload),

    delete: (id: string): Promise<void> => api.delete(`/categories/${id}`),
  },

  // ── Flash Sale ─────────────────────────────────────────────────────────────
  flashSale: {
    getSessions: (): Promise<AdminFlashSaleSession[]> => api.get('/admin/flash-sale'),

    createSession: (payload: CreateFlashSaleSessionPayload): Promise<{ id: string }> =>
      api.post('/admin/flash-sale', payload),

    toggleSession: (id: string): Promise<{ isActive: boolean }> =>
      api.patch(`/admin/flash-sale/${id}/toggle`, {}),

    deleteSession: (id: string): Promise<void> => api.delete(`/admin/flash-sale/${id}`),

    getItems: (sessionId: string): Promise<AdminFlashSaleItem[]> =>
      api.get(`/admin/flash-sale/${sessionId}/items`),

    addItem: (sessionId: string, payload: AddFlashSaleItemPayload): Promise<AdminFlashSaleItem> =>
      api.post(`/admin/flash-sale/${sessionId}/items`, payload),

    removeItem: (sessionId: string, itemId: string): Promise<void> =>
      api.delete(`/admin/flash-sale/${sessionId}/items/${itemId}`),
  },

  // ── Users — /api/v1/users (admin-capable, requires auth) ─────────────────
  users: {
    getAll: (params?: {
      page?: number;
      pageSize?: number;
      search?: string;
      role?: string;
    }): Promise<PagedResult<AdminUser>> => {
      const qs = new URLSearchParams();
      if (params?.page) qs.set('page', String(params.page));
      if (params?.pageSize) qs.set('pageSize', String(params.pageSize));
      if (params?.search) qs.set('search', params.search);
      if (params?.role) qs.set('role', params.role);
      return api.get(`/users${qs.toString() ? `?${qs}` : ''}`);
    },

    update: (id: string, payload: UpdateUserPayload): Promise<AdminUser> =>
      api.put(`/users/${id}`, payload),

    delete: (id: string): Promise<void> => api.delete(`/users/${id}`),

    assignWarehouse: (
      userId: string,
      warehouseId: string | null,
      targetType: 'Driver' | 'Manager'
    ): Promise<void> =>
      api.patch(`/admin/users/${userId}/assign-warehouse`, { warehouseId, targetType }),
  },

  // ── Wallet / Withdraw ──────────────────────────────────────────────────────
  wallet: {
    getWithdrawRequests: (
      status: 'Pending' | 'Completed' | 'Rejected'
    ): Promise<WithdrawRequest[]> => api.get(`/admin/wallet/withdraw-requests?status=${status}`),

    completeWithdraw: (id: string, note?: string | null): Promise<void> =>
      api.patch(`/admin/wallet/withdraw-requests/${id}/complete`, { note }),

    rejectWithdraw: (id: string, note?: string | null): Promise<void> =>
      api.patch(`/admin/wallet/withdraw-requests/${id}/reject`, { note }),
  },

  // ── Products ────────────────────────────────────────────────────────────────
  getProductById: (id: string): Promise<Product> => api.get(`/products/${id}`),

  products: {
    create: (payload: CreateProductPayload): Promise<Product> => api.post('/products', payload),

    update: (id: string, payload: UpdateProductPayload): Promise<Product> =>
      api.put(`/products/${id}`, payload),

    delete: (id: string): Promise<void> => api.delete(`/products/${id}`),
  },

  // ── Vouchers ────────────────────────────────────────────────────────────────
  vouchers: {
    getAll: (): Promise<AdminVoucher[]> => api.get('/admin/vouchers'),

    create: (payload: CreateVoucherPayload): Promise<AdminVoucher> =>
      api.post('/admin/vouchers', payload),

    update: (id: string, payload: UpdateVoucherPayload): Promise<AdminVoucher> =>
      api.put(`/admin/vouchers/${id}`, payload),

    delete: (id: string): Promise<void> => api.delete(`/admin/vouchers/${id}`),
  },

  // ── Warehouses ─────────────────────────────────────────────────────────────
  warehouses: {
    getAll: (): Promise<Warehouse[]> => api.get('/admin/warehouses'),

    create: (payload: WarehousePayload): Promise<{ id: string }> =>
      api.post('/admin/warehouses', payload),

    update: (id: string, payload: WarehousePayload): Promise<{ id: string }> =>
      api.put(`/admin/warehouses/${id}`, payload),

    toggle: (id: string): Promise<{ isActive: boolean }> =>
      api.patch(`/admin/warehouses/${id}/toggle`, {}),

    delete: (id: string): Promise<void> => api.delete(`/admin/warehouses/${id}`),
  },
};
