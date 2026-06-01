// Notifications endpoint chưa được triển khai trong backend
// File này giữ lại để tương lai mở rộng

export const notificationsService = {
  getAll: async (_page?: number, _pageSize?: number) => ({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  }),
  markRead: async (_id: string) => {},
  markAllRead: async () => {},
  getUnreadCount: async () => ({ count: 0 }),
};
