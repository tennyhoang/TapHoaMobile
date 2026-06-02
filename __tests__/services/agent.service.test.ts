import { agentService } from '@/services/agent.service';
import { api } from '@/lib/api';

jest.mock('@/lib/api', () => ({ api: { get: jest.fn(), patch: jest.fn() } }));

const mockApi = api as jest.Mocked<typeof api>;

const mockOrder = { id: 'o1', status: 'InHub_ReadyForPickup' as const };
const mockPaged = { items: [mockOrder], totalCount: 1, page: 1, pageSize: 50, totalPages: 1 };

describe('agentService', () => {
  describe('getOrders', () => {
    it('calls GET /agent/orders with status, page and pageSize', async () => {
      mockApi.get.mockResolvedValueOnce(mockPaged);
      const result = await agentService.getOrders('InHub_ReadyForPickup');
      expect(result).toEqual(mockPaged);
      expect(mockApi.get).toHaveBeenCalledWith(
        '/agent/orders?status=InHub_ReadyForPickup&page=1&pageSize=50'
      );
    });

    it('works for different statuses', async () => {
      mockApi.get.mockResolvedValueOnce(mockPaged);
      await agentService.getOrders('Completed');
      expect(mockApi.get).toHaveBeenCalledWith('/agent/orders?status=Completed&page=1&pageSize=50');
    });

    it('propagates error', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Lỗi server'));
      await expect(agentService.getOrders('Completed')).rejects.toThrow('Lỗi server');
    });
  });

  describe('arrive', () => {
    it('calls PATCH /agent/orders/:id/arrive', async () => {
      mockApi.patch.mockResolvedValueOnce(mockOrder);
      const result = await agentService.arrive('o1');
      expect(result).toEqual(mockOrder);
      expect(mockApi.patch).toHaveBeenCalledWith('/agent/orders/o1/arrive', {});
    });
  });

  describe('completePickup', () => {
    it('calls PATCH /agent/orders/:id/complete-pickup', async () => {
      mockApi.patch.mockResolvedValueOnce({ ...mockOrder, status: 'Completed' });
      const result = await agentService.completePickup('o1');
      expect(result.status).toBe('Completed');
      expect(mockApi.patch).toHaveBeenCalledWith('/agent/orders/o1/complete-pickup', {});
    });
  });
});
