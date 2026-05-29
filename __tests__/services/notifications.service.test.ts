import { notificationsService } from '../../services/notifications.service';
import { api } from '../../lib/api';

jest.mock('../../lib/api', () => ({
  api: {
    get: jest.fn(),
    patch: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

const mockNotification = {
  id: 'notif1',
  type: 'OrderStatus' as const,
  title: 'Đơn hàng đã được xác nhận',
  body: 'Đơn hàng #order1 đang được xử lý.',
  isRead: false,
  createdAt: '2025-05-01T10:00:00Z',
};

const mockPaged = {
  items: [mockNotification],
  totalCount: 1,
  page: 1,
  pageSize: 20,
  totalPages: 1,
};

describe('notificationsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('calls GET /notifications with default page=1 and pageSize=20', async () => {
      mockApi.get.mockResolvedValueOnce(mockPaged);

      const result = await notificationsService.getAll();

      expect(result).toEqual(mockPaged);
      expect(mockApi.get).toHaveBeenCalledWith('/notifications?page=1&pageSize=20');
    });

    it('passes custom page and pageSize', async () => {
      mockApi.get.mockResolvedValueOnce(mockPaged);

      await notificationsService.getAll(2, 10);

      expect(mockApi.get).toHaveBeenCalledWith('/notifications?page=2&pageSize=10');
    });

    it('propagates error when api throws', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Lỗi 401'));

      await expect(notificationsService.getAll()).rejects.toThrow('Lỗi 401');
    });
  });

  describe('markRead', () => {
    it('calls PATCH /notifications/:id/read', async () => {
      mockApi.patch.mockResolvedValueOnce(undefined);

      await notificationsService.markRead('notif1');

      expect(mockApi.patch).toHaveBeenCalledWith('/notifications/notif1/read', {});
    });
  });

  describe('markAllRead', () => {
    it('calls PATCH /notifications/read-all', async () => {
      mockApi.patch.mockResolvedValueOnce(undefined);

      await notificationsService.markAllRead();

      expect(mockApi.patch).toHaveBeenCalledWith('/notifications/read-all', {});
    });
  });

  describe('getUnreadCount', () => {
    it('calls GET /notifications/unread-count and returns count', async () => {
      mockApi.get.mockResolvedValueOnce({ count: 5 });

      const result = await notificationsService.getUnreadCount();

      expect(result).toEqual({ count: 5 });
      expect(mockApi.get).toHaveBeenCalledWith('/notifications/unread-count');
    });

    it('returns count of 0 when no unread notifications', async () => {
      mockApi.get.mockResolvedValueOnce({ count: 0 });

      const result = await notificationsService.getUnreadCount();

      expect(result.count).toBe(0);
    });
  });
});
