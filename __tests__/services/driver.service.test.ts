import { driverService } from '@/services/driver.service';
import { api } from '@/lib/api';

jest.mock('@/lib/api', () => ({ api: { get: jest.fn(), patch: jest.fn(), post: jest.fn() } }));

const mockApi = api as jest.Mocked<typeof api>;

describe('driverService', () => {
  describe('getMyWarehouse', () => {
    it('calls GET /driver/me/warehouse', async () => {
      const warehouse = {
        id: 'w1',
        name: 'Kho HCM',
        fullAddress: '123 Nguyễn Huệ',
        phoneNumber: '028-1234',
      };
      mockApi.get.mockResolvedValueOnce(warehouse);
      const result = await driverService.getMyWarehouse();
      expect(result).toEqual(warehouse);
      expect(mockApi.get).toHaveBeenCalledWith('/driver/me/warehouse');
    });
  });

  describe('getOrders', () => {
    it('calls GET /driver/orders', async () => {
      mockApi.get.mockResolvedValueOnce([]);
      await driverService.getOrders();
      expect(mockApi.get).toHaveBeenCalledWith('/driver/orders');
    });
  });

  describe('getShippingOrders', () => {
    it('calls GET /driver/orders/shipping with pageSize=50', async () => {
      mockApi.get.mockResolvedValueOnce({
        items: [],
        totalCount: 0,
        page: 1,
        pageSize: 50,
        totalPages: 1,
      });
      await driverService.getShippingOrders();
      expect(mockApi.get).toHaveBeenCalledWith('/driver/orders/shipping?pageSize=50');
    });
  });

  describe('getCompletedOrders', () => {
    it('calls GET /driver/orders/delivered with pageSize=30', async () => {
      mockApi.get.mockResolvedValueOnce({
        items: [],
        totalCount: 0,
        page: 1,
        pageSize: 30,
        totalPages: 1,
      });
      await driverService.getCompletedOrders();
      expect(mockApi.get).toHaveBeenCalledWith('/driver/orders/delivered?pageSize=30');
    });
  });

  describe('pickupOrders', () => {
    it('calls PATCH /driver/orders/pickup-from-warehouse with orderIds', async () => {
      mockApi.patch.mockResolvedValueOnce({ shipped: 2, errors: [] });
      const result = await driverService.pickupOrders(['o1', 'o2']);
      expect(result).toEqual({ shipped: 2, errors: [] });
      expect(mockApi.patch).toHaveBeenCalledWith('/driver/orders/pickup-from-warehouse', {
        orderIds: ['o1', 'o2'],
      });
    });

    it('propagates error', async () => {
      mockApi.patch.mockRejectedValueOnce(new Error('Không tìm thấy đơn'));
      await expect(driverService.pickupOrders(['invalid'])).rejects.toThrow('Không tìm thấy đơn');
    });
  });

  describe('optimizeRoute', () => {
    it('calls POST /driver/optimize-route with orderAddresses', async () => {
      const mockRoute = { stops: [], isOptimized: true, hubLng: 106.7, hubLat: 10.77 };
      mockApi.post.mockResolvedValueOnce(mockRoute);
      const result = await driverService.optimizeRoute(['123 Lê Lợi, Q1']);
      expect(result).toEqual(mockRoute);
      expect(mockApi.post).toHaveBeenCalledWith('/driver/optimize-route', {
        orderAddresses: ['123 Lê Lợi, Q1'],
      });
    });
  });
});
