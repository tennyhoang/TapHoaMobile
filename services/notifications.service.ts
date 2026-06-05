import { api } from '@/lib/api';
import type { PagedResult, Notification } from '@/types';

export const notificationsService = {
  getAll: (page = 1, pageSize = 20): Promise<PagedResult<Notification>> =>
    api.get(`/notifications?page=${page}&pageSize=${pageSize}`),

  markRead: (id: string): Promise<void> => api.patch(`/notifications/${id}/read`, {}),

  markAllRead: (): Promise<void> => api.patch('/notifications/read-all', {}),

  getUnreadCount: (): Promise<{ count: number }> => api.get('/notifications/unread-count'),
};
