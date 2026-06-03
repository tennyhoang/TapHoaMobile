import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import NotificationsScreen from '@/app/notifications';
import { notificationsService } from '@/services/notifications.service';

let triggerFocusEffect: (() => void) | null = null;

jest.mock('@/services/notifications.service', () => ({
  notificationsService: { getAll: jest.fn(), markRead: jest.fn(), markAllRead: jest.fn() },
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useFocusEffect: (cb: any) => {
    triggerFocusEffect = cb;
  },
}));

jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual('react-native');
  return { Ionicons: (props: any) => <Text>{props.name}</Text> };
});

jest.mock('@/components/EmptyState', () => {
  const { View, Text } = jest.requireActual('react-native');
  const Mock = ({ title }: any) => (
    <View>
      <Text>{title}</Text>
    </View>
  );
  Mock.displayName = 'EmptyState';
  return Mock;
});

jest.mock('@/components/ErrorScreen', () => {
  const { View, Text, TouchableOpacity } = jest.requireActual('react-native');
  const ErrorMock = ({ onRetry }: any) => (
    <View>
      <Text>Không có kết nối</Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry}>
          <Text>Thử lại</Text>
        </TouchableOpacity>
      )}
    </View>
  );
  ErrorMock.displayName = 'ErrorScreen';
  return ErrorMock;
});

function loadScreen() {
  act(() => {
    triggerFocusEffect?.();
  });
}

const mockService = jest.mocked(notificationsService);
const wrapper = ({ children }: any) => <SafeAreaProvider>{children}</SafeAreaProvider>;

const unreadOrderNotif = {
  id: 'n1',
  type: 'OrderStatus' as const,
  title: 'Đơn hàng đã giao',
  body: 'Đơn hàng của bạn đã giao thành công',
  isRead: false,
  createdAt: '2025-06-01T10:00:00Z',
  data: { orderId: 'order-1' },
};

const readNotif = {
  id: 'n2',
  type: 'Promotion' as const,
  title: 'Khuyến mãi tháng 6',
  body: 'Giảm giá 20%',
  isRead: true,
  createdAt: '2025-06-01T09:00:00Z',
};

describe('NotificationsScreen', () => {
  beforeEach(() => {
    triggerFocusEffect = null;
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockService.getAll.mockReturnValue(new Promise(() => {}));
    render(<NotificationsScreen />, { wrapper });
    loadScreen();
    expect(mockService.getAll).toHaveBeenCalledWith(1, 20);
  });

  it('renders empty state when no notifications', async () => {
    mockService.getAll.mockResolvedValueOnce({ items: [], totalPages: 1 });
    const { getByText } = render(<NotificationsScreen />, { wrapper });
    loadScreen();
    await waitFor(() => {
      expect(getByText('Không có thông báo nào')).toBeTruthy();
    });
  });

  it('renders error state when load fails', async () => {
    mockService.getAll.mockRejectedValueOnce(new Error('Network error'));
    const { getByText } = render(<NotificationsScreen />, { wrapper });
    loadScreen();
    await waitFor(() => {
      expect(getByText('Không có kết nối')).toBeTruthy();
    });
  });

  it('retries loading when Thử lại pressed', async () => {
    mockService.getAll.mockRejectedValueOnce(new Error('Network error'));
    mockService.getAll.mockResolvedValueOnce({ items: [], totalPages: 1 });
    const { getByText } = render(<NotificationsScreen />, { wrapper });
    loadScreen();
    await waitFor(() => getByText('Thử lại'));
    fireEvent.press(getByText('Thử lại'));
    await waitFor(() => {
      expect(mockService.getAll).toHaveBeenCalledTimes(2);
      expect(mockService.getAll).toHaveBeenCalledWith(1, 20);
    });
  });

  it('renders notification list', async () => {
    mockService.getAll.mockResolvedValueOnce({
      items: [unreadOrderNotif, readNotif],
      totalPages: 1,
    });
    const { getByText } = render(<NotificationsScreen />, { wrapper });
    loadScreen();
    await waitFor(() => {
      expect(getByText('Đơn hàng đã giao')).toBeTruthy();
      expect(getByText('Khuyến mãi tháng 6')).toBeTruthy();
    });
  });

  it('shows Đọc tất cả button when unread exists', async () => {
    mockService.getAll.mockResolvedValueOnce({
      items: [unreadOrderNotif, readNotif],
      totalPages: 1,
    });
    const { getByText } = render(<NotificationsScreen />, { wrapper });
    loadScreen();
    await waitFor(() => {
      expect(getByText('Đọc tất cả')).toBeTruthy();
    });
  });

  it('hides Đọc tất cả when all read', async () => {
    mockService.getAll.mockResolvedValueOnce({ items: [readNotif], totalPages: 1 });
    const { queryByText } = render(<NotificationsScreen />, { wrapper });
    loadScreen();
    await waitFor(() => {
      expect(queryByText('Đọc tất cả')).toBeNull();
    });
  });

  it('calls markAllRead when Đọc tất cả pressed', async () => {
    mockService.getAll.mockResolvedValueOnce({ items: [unreadOrderNotif], totalPages: 1 });
    mockService.markAllRead.mockResolvedValueOnce(undefined);
    const { getByText } = render(<NotificationsScreen />, { wrapper });
    loadScreen();
    await waitFor(() => getByText('Đọc tất cả'));
    fireEvent.press(getByText('Đọc tất cả'));
    await waitFor(() => {
      expect(mockService.markAllRead).toHaveBeenCalled();
    });
  });

  it('marks notification as read on tap', async () => {
    mockService.getAll.mockResolvedValueOnce({ items: [unreadOrderNotif], totalPages: 1 });
    mockService.markRead.mockResolvedValueOnce(undefined);
    const { getByText } = render(<NotificationsScreen />, { wrapper });
    loadScreen();
    await waitFor(() => getByText('Đơn hàng đã giao'));
    fireEvent.press(getByText('Đơn hàng đã giao'));
    await waitFor(() => {
      expect(mockService.markRead).toHaveBeenCalledWith('n1');
    });
  });

  it('navigates to order on OrderStatus tap with orderId', async () => {
    mockService.getAll.mockResolvedValueOnce({ items: [unreadOrderNotif], totalPages: 1 });
    mockService.markRead.mockResolvedValueOnce(undefined);
    const { router } = jest.requireMock('expo-router');
    const { getByText } = render(<NotificationsScreen />, { wrapper });
    loadScreen();
    await waitFor(() => getByText('Đơn hàng đã giao'));
    fireEvent.press(getByText('Đơn hàng đã giao'));
    await waitFor(() => {
      expect(router.push).toHaveBeenCalledWith('/order/order-1');
    });
  });
});
