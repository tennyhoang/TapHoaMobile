import { ordersService } from '../../services/orders.service';
import { api } from '../../lib/api';

jest.mock('../../lib/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

const mockHub = {
  id: 'hub1',
  name: 'Hub Quận 1',
  address: '123 Lê Lợi',
  ward: 'Bến Nghé',
  district: 'Quận 1',
  city: 'TP.HCM',
  latitude: 10.77,
  longitude: 106.7,
};

const mockOrder = {
  id: 'order1',
  status: 'Paid_WaitingForBatch' as const,
  totalAmount: 150000,
  walletAmountUsed: 0,
  hub: mockHub,
  items: [
    {
      productId: 'p1',
      productName: 'Gạo ST25',
      quantity: 3,
      unitPrice: 50000,
      subtotal: 150000,
    },
  ],
  createdAt: '2025-05-01T10:00:00Z',
};

const mockPaged = {
  items: [mockOrder],
  totalCount: 1,
  page: 1,
  pageSize: 20,
  totalPages: 1,
};

describe('ordersService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMyOrders', () => {
    it('calls GET /orders/my with no query string when no params', async () => {
      mockApi.get.mockResolvedValueOnce(mockPaged);

      const result = await ordersService.getMyOrders();

      expect(result).toEqual(mockPaged);
      expect(mockApi.get).toHaveBeenCalledWith('/orders/my');
    });

    it('appends page and pageSize params', async () => {
      mockApi.get.mockResolvedValueOnce(mockPaged);

      await ordersService.getMyOrders({ page: 2, pageSize: 10 });

      const url = (mockApi.get as jest.Mock).mock.calls[0][0] as string;
      expect(url).toContain('page=2');
      expect(url).toContain('pageSize=10');
    });

    it('appends status filter param', async () => {
      mockApi.get.mockResolvedValueOnce(mockPaged);

      await ordersService.getMyOrders({ status: 'Completed' });

      expect(mockApi.get).toHaveBeenCalledWith('/orders/my?status=Completed');
    });

    it('propagates error when api throws', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Lỗi 500'));

      await expect(ordersService.getMyOrders()).rejects.toThrow('Lỗi 500');
    });
  });

  describe('getById', () => {
    it('calls GET /orders/:id and returns order', async () => {
      mockApi.get.mockResolvedValueOnce(mockOrder);

      const result = await ordersService.getById('order1');

      expect(result).toEqual(mockOrder);
      expect(mockApi.get).toHaveBeenCalledWith('/orders/order1');
    });
  });

  describe('create', () => {
    it('calls POST /orders with payload and returns new order', async () => {
      mockApi.post.mockResolvedValueOnce(mockOrder);

      const payload = {
        hubId: 'hub1',
        note: 'Giao buổi sáng',
        paymentMethod: 'COD' as const,
        useWallet: false,
      };
      const result = await ordersService.create(payload);

      expect(result).toEqual(mockOrder);
      expect(mockApi.post).toHaveBeenCalledWith('/orders', payload);
    });

    it('creates order with wallet payment and no note', async () => {
      mockApi.post.mockResolvedValueOnce(mockOrder);

      const payload = { hubId: 'hub1', useWallet: true };
      await ordersService.create(payload);

      expect(mockApi.post).toHaveBeenCalledWith('/orders', payload);
    });
  });

  describe('cancel', () => {
    it('calls PATCH /orders/:id/cancel with cancelReason', async () => {
      const cancelledOrder = { ...mockOrder, status: 'Cancelled' as const };
      mockApi.patch.mockResolvedValueOnce(cancelledOrder);

      const result = await ordersService.cancel('order1', 'Đổi ý');

      expect(result).toEqual(cancelledOrder);
      expect(mockApi.patch).toHaveBeenCalledWith('/orders/order1/cancel', {
        cancelReason: 'Đổi ý',
      });
    });

    it('calls PATCH /orders/:id/cancel with undefined reason when not provided', async () => {
      mockApi.patch.mockResolvedValueOnce({ ...mockOrder, status: 'Cancelled' as const });

      await ordersService.cancel('order1');

      expect(mockApi.patch).toHaveBeenCalledWith('/orders/order1/cancel', {
        cancelReason: undefined,
      });
    });
  });
});
