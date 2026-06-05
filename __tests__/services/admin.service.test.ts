import { adminService } from '@/services/admin.service';
import { api } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  api: { get: jest.fn(), patch: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

const mockApi = api as jest.Mocked<typeof api>;

const mockStats = { totalOrders: 150, totalRevenue: 5000000, pendingOrders: 12, totalUsers: 320 };
const mockOrder = { id: 'o1', status: 'Paid_WaitingForBatch' as const };
const mockPaged = { items: [mockOrder], totalCount: 1, page: 1, pageSize: 20, totalPages: 1 };
const mockCategory = {
  id: 'c1',
  name: 'Rau củ',
  description: '',
  imageUrl: '',
  parentId: '',
  children: [],
  createdAt: '',
};
const mockSession = {
  id: 'fs1',
  name: 'Sale T6',
  startTime: '2025-06-01T00:00:00Z',
  endTime: '2025-06-07T00:00:00Z',
  isActive: true,
  createdAt: '2025-05-01T00:00:00Z',
  itemCount: 3,
};
const mockItem = {
  id: 'fi1',
  productId: 'p1',
  productName: 'Táo',
  thumbnailUrl: '',
  originalPrice: 50000,
  flashSalePrice: 35000,
  flashSaleStock: 100,
  soldCount: 10,
};
const mockUser = {
  id: 'u1',
  fullName: 'Nguyễn Văn A',
  email: 'a@test.com',
  role: 'User',
  isActive: true,
  createdAt: '2025-01-01T00:00:00Z',
};
const mockWithdraw = {
  id: 'w1',
  amount: 500000,
  bankName: 'VCB',
  accountNumber: '123456',
  holderName: 'Nguyễn Văn A',
  status: 'Pending' as const,
  createdAt: '2025-01-01T00:00:00Z',
  userName: 'A',
  userEmail: 'a@test.com',
};
const mockWarehouse = {
  id: 'wh1',
  name: 'Kho HCM',
  address: '123 Nguyễn Huệ',
  ward: 'Bến Nghé',
  district: 'Quận 1',
  province: 'TPHCM',
  isActive: true,
};

describe('adminService', () => {
  describe('getStats', () => {
    it('calls GET /admin/stats', async () => {
      mockApi.get.mockResolvedValueOnce(mockStats);
      const result = await adminService.getStats();
      expect(result).toEqual(mockStats);
      expect(mockApi.get).toHaveBeenCalledWith('/admin/stats');
    });
  });

  describe('getOrders', () => {
    it('calls GET /admin/orders with no params', async () => {
      mockApi.get.mockResolvedValueOnce(mockPaged);
      await adminService.getOrders();
      expect(mockApi.get).toHaveBeenCalledWith('/admin/orders');
    });

    it('appends page and pageSize', async () => {
      mockApi.get.mockResolvedValueOnce(mockPaged);
      await adminService.getOrders({ page: 2, pageSize: 10 });
      const url = (mockApi.get as jest.Mock).mock.calls[0][0] as string;
      expect(url).toContain('page=2');
      expect(url).toContain('pageSize=10');
    });

    it('appends status filter', async () => {
      mockApi.get.mockResolvedValueOnce(mockPaged);
      await adminService.getOrders({ status: 'Completed' });
      expect(mockApi.get).toHaveBeenCalledWith('/admin/orders?status=Completed');
    });

    it('propagates error', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Forbidden'));
      await expect(adminService.getOrders()).rejects.toThrow('Forbidden');
    });
  });

  describe('updateOrderStatus', () => {
    it('calls PATCH /admin/orders/:id/status', async () => {
      mockApi.patch.mockResolvedValueOnce({ ...mockOrder, status: 'ShippingToHub' });
      const result = await adminService.updateOrderStatus('o1', 'ShippingToHub');
      expect(result.status).toBe('ShippingToHub');
      expect(mockApi.patch).toHaveBeenCalledWith('/admin/orders/o1/status', {
        status: 'ShippingToHub',
      });
    });

    it('propagates error', async () => {
      mockApi.patch.mockRejectedValueOnce(new Error('Order not found'));
      await expect(adminService.updateOrderStatus('bad', 'Completed')).rejects.toThrow(
        'Order not found'
      );
    });
  });

  // ── Categories ──────────────────────────────────────────────

  describe('categories', () => {
    it('getAll calls GET /categories', async () => {
      mockApi.get.mockResolvedValueOnce([mockCategory]);
      const result = await adminService.categories.getAll();
      expect(result).toEqual([mockCategory]);
      expect(mockApi.get).toHaveBeenCalledWith('/categories');
    });

    it('create calls POST /categories', async () => {
      mockApi.post.mockResolvedValueOnce(mockCategory);
      const payload = { name: 'Rau củ' };
      const result = await adminService.categories.create(payload);
      expect(result).toEqual(mockCategory);
      expect(mockApi.post).toHaveBeenCalledWith('/categories', payload);
    });

    it('update calls PUT /categories/:id', async () => {
      mockApi.put.mockResolvedValueOnce(mockCategory);
      const payload = { name: 'Rau củ quả' };
      const result = await adminService.categories.update('c1', payload);
      expect(result).toEqual(mockCategory);
      expect(mockApi.put).toHaveBeenCalledWith('/categories/c1', payload);
    });

    it('delete calls DELETE /categories/:id', async () => {
      mockApi.delete.mockResolvedValueOnce(undefined);
      await adminService.categories.delete('c1');
      expect(mockApi.delete).toHaveBeenCalledWith('/categories/c1');
    });
  });

  // ── Flash Sale ──────────────────────────────────────────────

  describe('flashSale', () => {
    it('getSessions calls GET /admin/flash-sale', async () => {
      mockApi.get.mockResolvedValueOnce([mockSession]);
      const result = await adminService.flashSale.getSessions();
      expect(result).toEqual([mockSession]);
      expect(mockApi.get).toHaveBeenCalledWith('/admin/flash-sale');
    });

    it('createSession calls POST /admin/flash-sale', async () => {
      mockApi.post.mockResolvedValueOnce({ id: 'fs1' });
      const payload = { name: 'Sale T6', startTime: '', endTime: '', isActive: true };
      const result = await adminService.flashSale.createSession(payload);
      expect(result).toEqual({ id: 'fs1' });
      expect(mockApi.post).toHaveBeenCalledWith('/admin/flash-sale', payload);
    });

    it('toggleSession calls PATCH /admin/flash-sale/:id/toggle', async () => {
      mockApi.patch.mockResolvedValueOnce({ isActive: false });
      const result = await adminService.flashSale.toggleSession('fs1');
      expect(result).toEqual({ isActive: false });
      expect(mockApi.patch).toHaveBeenCalledWith('/admin/flash-sale/fs1/toggle', {});
    });

    it('deleteSession calls DELETE /admin/flash-sale/:id', async () => {
      mockApi.delete.mockResolvedValueOnce(undefined);
      await adminService.flashSale.deleteSession('fs1');
      expect(mockApi.delete).toHaveBeenCalledWith('/admin/flash-sale/fs1');
    });

    it('getItems calls GET /admin/flash-sale/:id/items', async () => {
      mockApi.get.mockResolvedValueOnce([mockItem]);
      const result = await adminService.flashSale.getItems('fs1');
      expect(result).toEqual([mockItem]);
      expect(mockApi.get).toHaveBeenCalledWith('/admin/flash-sale/fs1/items');
    });

    it('addItem calls POST /admin/flash-sale/:id/items', async () => {
      mockApi.post.mockResolvedValueOnce(mockItem);
      const payload = { productId: 'p1', flashSalePrice: 35000, flashSaleStock: 100 };
      const result = await adminService.flashSale.addItem('fs1', payload);
      expect(result).toEqual(mockItem);
      expect(mockApi.post).toHaveBeenCalledWith('/admin/flash-sale/fs1/items', payload);
    });

    it('removeItem calls DELETE /admin/flash-sale/:id/items/:itemId', async () => {
      mockApi.delete.mockResolvedValueOnce(undefined);
      await adminService.flashSale.removeItem('fs1', 'fi1');
      expect(mockApi.delete).toHaveBeenCalledWith('/admin/flash-sale/fs1/items/fi1');
    });
  });

  // ── Users ───────────────────────────────────────────────────

  describe('users', () => {
    it('getAll calls GET /users with no params', async () => {
      mockApi.get.mockResolvedValueOnce({
        items: [mockUser],
        totalCount: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      });
      const result = await adminService.users.getAll();
      expect(result.items).toEqual([mockUser]);
      expect(mockApi.get).toHaveBeenCalledWith('/users');
    });

    it('getAll appends search and role', async () => {
      mockApi.get.mockResolvedValueOnce({
        items: [mockUser],
        totalCount: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      });
      await adminService.users.getAll({ search: 'Nguyễn', role: 'User' });
      const url = (mockApi.get as jest.Mock).mock.calls[0][0] as string;
      expect(url).toContain('search=Nguy%E1%BB%85n');
      expect(url).toContain('role=User');
    });

    it('update calls PUT /users/:id', async () => {
      mockApi.put.mockResolvedValueOnce(mockUser);
      const payload = { fullName: 'Nguyễn Văn B' };
      const result = await adminService.users.update('u1', payload);
      expect(result).toEqual(mockUser);
      expect(mockApi.put).toHaveBeenCalledWith('/users/u1', payload);
    });

    it('delete calls DELETE /users/:id', async () => {
      mockApi.delete.mockResolvedValueOnce(undefined);
      await adminService.users.delete('u1');
      expect(mockApi.delete).toHaveBeenCalledWith('/users/u1');
    });
  });

  // ── Wallet ──────────────────────────────────────────────────

  describe('wallet', () => {
    it('getWithdrawRequests calls GET with status', async () => {
      mockApi.get.mockResolvedValueOnce([mockWithdraw]);
      const result = await adminService.wallet.getWithdrawRequests('Pending');
      expect(result).toEqual([mockWithdraw]);
      expect(mockApi.get).toHaveBeenCalledWith('/admin/wallet/withdraw-requests?status=Pending');
    });

    it('completeWithdraw calls PATCH with note', async () => {
      mockApi.patch.mockResolvedValueOnce(undefined);
      await adminService.wallet.completeWithdraw('w1', 'Đã chuyển tiền');
      expect(mockApi.patch).toHaveBeenCalledWith('/admin/wallet/withdraw-requests/w1/complete', {
        note: 'Đã chuyển tiền',
      });
    });

    it('rejectWithdraw calls PATCH with note', async () => {
      mockApi.patch.mockResolvedValueOnce(undefined);
      await adminService.wallet.rejectWithdraw('w1', 'Sai thông tin');
      expect(mockApi.patch).toHaveBeenCalledWith('/admin/wallet/withdraw-requests/w1/reject', {
        note: 'Sai thông tin',
      });
    });
  });

  // ── Warehouses ──────────────────────────────────────────────

  describe('warehouses', () => {
    it('getAll calls GET /admin/warehouses', async () => {
      mockApi.get.mockResolvedValueOnce([mockWarehouse]);
      const result = await adminService.warehouses.getAll();
      expect(result).toEqual([mockWarehouse]);
      expect(mockApi.get).toHaveBeenCalledWith('/admin/warehouses');
    });

    it('create calls POST /admin/warehouses', async () => {
      mockApi.post.mockResolvedValueOnce({ id: 'wh1' });
      const payload = {
        name: 'Kho HCM',
        address: '123',
        ward: 'BN',
        district: 'Q1',
        province: 'TPHCM',
      };
      const result = await adminService.warehouses.create(payload);
      expect(result).toEqual({ id: 'wh1' });
      expect(mockApi.post).toHaveBeenCalledWith('/admin/warehouses', payload);
    });

    it('update calls PUT /admin/warehouses/:id', async () => {
      mockApi.put.mockResolvedValueOnce({ id: 'wh1' });
      const payload = {
        name: 'Kho HCM 2',
        address: '456',
        ward: 'BN',
        district: 'Q1',
        province: 'TPHCM',
      };
      const result = await adminService.warehouses.update('wh1', payload);
      expect(result).toEqual({ id: 'wh1' });
      expect(mockApi.put).toHaveBeenCalledWith('/admin/warehouses/wh1', payload);
    });

    it('toggle calls PATCH /admin/warehouses/:id/toggle', async () => {
      mockApi.patch.mockResolvedValueOnce({ isActive: false });
      const result = await adminService.warehouses.toggle('wh1');
      expect(result).toEqual({ isActive: false });
      expect(mockApi.patch).toHaveBeenCalledWith('/admin/warehouses/wh1/toggle', {});
    });

    it('delete calls DELETE /admin/warehouses/:id', async () => {
      mockApi.delete.mockResolvedValueOnce(undefined);
      await adminService.warehouses.delete('wh1');
      expect(mockApi.delete).toHaveBeenCalledWith('/admin/warehouses/wh1');
    });
  });
});
