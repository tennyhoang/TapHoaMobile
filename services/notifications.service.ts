import { api } from '@/lib/api';
import type { Notification, PagedResult } from '@/types';

export const notificationsService = {
  getAll: (page = 1, pageSize = 20): Promise<PagedResult<Notification>> =>
    api.get<PagedResult<Notification>>(`/notifications?page=${page}&pageSize=${pageSize}`),

  markRead: (id: string): Promise<void> => api.patch<void>(`/notifications/${id}/read`, {}),

  markAllRead: (): Promise<void> => api.patch<void>('/notifications/read-all', {}),

  getUnreadCount: (): Promise<{ count: number }> =>
    api.get<{ count: number }>('/notifications/unread-count'),
};
