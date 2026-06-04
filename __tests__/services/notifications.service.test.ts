import { notificationsService } from '../../services/notifications.service';

jest.mock('../../lib/api', () => ({
  api: {
    get: jest.fn(),
    patch: jest.fn(),
  },
}));

const { api } = jest.requireMock('../../lib/api');

describe('notificationsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('calls GET /notifications with default pagination', async () => {
      const mockData = { items: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0 };
      api.get.mockResolvedValue(mockData);

      const result = await notificationsService.getAll();

      expect(api.get).toHaveBeenCalledWith('/notifications?page=1&pageSize=20');
      expect(result).toEqual(mockData);
    });

    it('accepts custom page and pageSize params', async () => {
      api.get.mockResolvedValue({ items: [], totalCount: 0, page: 2, pageSize: 10, totalPages: 0 });

      const result = await notificationsService.getAll(2, 10);

      expect(api.get).toHaveBeenCalledWith('/notifications?page=2&pageSize=10');
      expect(result.items).toEqual([]);
    });
  });

  describe('markRead', () => {
    it('calls PATCH /notifications/:id/read', async () => {
      api.patch.mockResolvedValue(undefined);

      await notificationsService.markRead('notif1');

      expect(api.patch).toHaveBeenCalledWith('/notifications/notif1/read', {});
    });
  });

  describe('markAllRead', () => {
    it('calls PATCH /notifications/read-all', async () => {
      api.patch.mockResolvedValue(undefined);

      await notificationsService.markAllRead();

      expect(api.patch).toHaveBeenCalledWith('/notifications/read-all', {});
    });
  });

  describe('getUnreadCount', () => {
    it('calls GET /notifications/unread-count', async () => {
      api.get.mockResolvedValue({ count: 3 });

      const result = await notificationsService.getUnreadCount();

      expect(api.get).toHaveBeenCalledWith('/notifications/unread-count');
      expect(result).toEqual({ count: 3 });
    });
  });
});
