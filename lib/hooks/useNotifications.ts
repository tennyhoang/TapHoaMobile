import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsService } from '@/services/notifications.service';
import { queryKeys } from './queryKeys';

export function useNotifications(page?: number, pageSize?: number) {
  return useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: () => notificationsService.getAll(page, pageSize),
    staleTime: 30_000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unread,
    queryFn: () => notificationsService.getUnreadCount(),
    staleTime: 15_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
      qc.invalidateQueries({ queryKey: queryKeys.notifications.unread });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
      qc.invalidateQueries({ queryKey: queryKeys.notifications.unread });
    },
  });
}
