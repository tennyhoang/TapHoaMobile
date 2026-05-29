import { flashSaleService } from '../../services/flashsale.service';
import { api } from '../../lib/api';

jest.mock('../../lib/api', () => ({
  api: {
    get: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

const mockSession = {
  sessionId: 'session1',
  name: 'Flash Sale Sáng',
  startTime: '2025-05-01T08:00:00Z',
  endTime: '2025-05-01T10:00:00Z',
  products: [
    {
      id: 'fp1',
      name: 'Gạo ST25',
      categoryName: 'Thực phẩm',
      originalPrice: 60000,
      flashSalePrice: 45000,
      flashSaleStock: 50,
      soldCount: 10,
      stockRemaining: 40,
    },
  ],
};

describe('flashSaleService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrent', () => {
    it('calls GET /flash-sale/current and returns active session', async () => {
      mockApi.get.mockResolvedValueOnce(mockSession);

      const result = await flashSaleService.getCurrent();

      expect(result).toEqual(mockSession);
      expect(mockApi.get).toHaveBeenCalledWith('/flash-sale/current');
    });

    it('returns null when no active flash sale session', async () => {
      mockApi.get.mockResolvedValueOnce(null);

      const result = await flashSaleService.getCurrent();

      expect(result).toBeNull();
    });

    it('propagates error when api throws', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Lỗi mạng'));

      await expect(flashSaleService.getCurrent()).rejects.toThrow('Lỗi mạng');
    });
  });
});
