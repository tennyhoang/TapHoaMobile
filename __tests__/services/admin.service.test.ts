import { adminService } from '@/services/admin.service';
import { api } from '@/lib/api';

jest.mock('@/lib/api', () => ({ api: { get: jest.fn(), patch: jest.fn() } }));

const mockApi = api as jest.Mocked<typeof api>;

const mockStats = { totalOrders: 150, totalRevenue: 5000000, pendingOrders: 12, totalUsers: 320 };
const mockOrder = { id: 'o1', status: 'Paid_WaitingForBatch' as const };
const mockPaged = { items: [mockOrder], totalCount: 1, page: 1, pageSize: 20, totalPages: 1 };

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
});
