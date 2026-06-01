import { notificationsService } from '../../services/notifications.service';

// Notifications endpoint không có trong backend — service là stub trả empty data
describe('notificationsService', () => {
  describe('getAll', () => {
    it('returns empty paged result (stub — endpoint not in backend)', async () => {
      const result = await notificationsService.getAll();

      expect(result).toEqual({
        items: [],
        totalCount: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
      });
    });

    it('accepts page and pageSize params without error', async () => {
      const result = await notificationsService.getAll(2, 10);

      expect(result.items).toEqual([]);
      expect(result.totalCount).toBe(0);
    });

    it('resolves (does not reject)', async () => {
      await expect(notificationsService.getAll()).resolves.toBeDefined();
    });
  });

  describe('markRead', () => {
    it('resolves without error (stub)', async () => {
      await expect(notificationsService.markRead('notif1')).resolves.toBeUndefined();
    });
  });

  describe('markAllRead', () => {
    it('resolves without error (stub)', async () => {
      await expect(notificationsService.markAllRead()).resolves.toBeUndefined();
    });
  });

  describe('getUnreadCount', () => {
    it('returns count of 0 (stub)', async () => {
      const result = await notificationsService.getUnreadCount();

      expect(result).toEqual({ count: 0 });
    });
  });
});
