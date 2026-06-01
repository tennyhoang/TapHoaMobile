import { walletService } from '../../services/wallet.service';
import { api } from '../../lib/api';

jest.mock('../../lib/api', () => ({
  api: {
    get: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

const mockWallet = {
  balance: 250000,
  recentTransactions: [
    {
      id: 'txn1',
      type: 'Credit' as const,
      amount: 100000,
      description: 'Nạp tiền ví',
      createdAt: '2025-05-01T10:00:00Z',
    },
  ],
};

const mockTransaction = {
  id: 'txn1',
  type: 'Debit' as const,
  amount: 50000,
  description: 'Thanh toán đơn hàng',
  createdAt: '2025-05-01T10:00:00Z',
};

const mockPaged = {
  items: [mockTransaction],
  totalCount: 1,
  page: 1,
  pageSize: 20,
  totalPages: 1,
};

describe('walletService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBalance', () => {
    it('calls GET /wallet/me and returns wallet data', async () => {
      mockApi.get.mockResolvedValueOnce(mockWallet);

      const result = await walletService.getBalance();

      expect(result).toEqual(mockWallet);
      expect(mockApi.get).toHaveBeenCalledWith('/wallet/me');
    });

    it('propagates error when api throws', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Lỗi 401'));

      await expect(walletService.getBalance()).rejects.toThrow('Lỗi 401');
    });
  });

  describe('getTransactions', () => {
    it('uses default page=1 and pageSize=20', async () => {
      mockApi.get.mockResolvedValueOnce(mockPaged);

      const result = await walletService.getTransactions();

      expect(result).toEqual(mockPaged);
      expect(mockApi.get).toHaveBeenCalledWith('/wallet/me/transactions?page=1&pageSize=20');
    });

    it('passes custom page and pageSize', async () => {
      mockApi.get.mockResolvedValueOnce(mockPaged);

      await walletService.getTransactions(3, 10);

      expect(mockApi.get).toHaveBeenCalledWith('/wallet/me/transactions?page=3&pageSize=10');
    });

    it('propagates error when api throws', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Lỗi mạng'));

      await expect(walletService.getTransactions()).rejects.toThrow('Lỗi mạng');
    });
  });
});
