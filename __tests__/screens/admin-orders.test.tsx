import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AdminOrdersScreen from '@/app/admin/orders/page';
import { adminService } from '@/services/admin.service';

jest.mock('@/services/admin.service', () => ({
  adminService: { getOrders: jest.fn(), updateOrderStatus: jest.fn() },
}));

jest.mock('@/lib/useRoleGuard', () => ({ useRoleGuard: jest.fn().mockReturnValue(undefined) }));

const mockToastShow = jest.fn();
jest.mock('@/components/Toast', () => ({
  useToast: () => ({ show: mockToastShow }),
}));

jest.mock('@/components/ScreenHeader', () => {
  const { View, Text } = jest.requireActual('react-native');
  const Mock = ({ title }: any) => (
    <View>
      <Text>{title}</Text>
    </View>
  );
  Mock.displayName = 'ScreenHeader';
  return Mock;
});

jest.mock('@/components/StatusBadge', () => {
  const { View, Text } = jest.requireActual('react-native');
  const Mock = ({ label }: any) => (
    <View>
      <Text>{label ?? 'StatusBadge'}</Text>
    </View>
  );
  Mock.displayName = 'StatusBadge';
  return Mock;
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
  const Mock = ({ onRetry }: any) => (
    <View>
      <Text>Lỗi tải dữ liệu</Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry}>
          <Text>Thử lại</Text>
        </TouchableOpacity>
      )}
    </View>
  );
  Mock.displayName = 'ErrorScreen';
  return Mock;
});

const mockService = jest.mocked(adminService);

const mockOrder = {
  id: 'o1',
  status: 'Paid_WaitingForBatch' as const,
  totalAmount: 150000,
  walletAmountUsed: 0,
  hub: {
    id: 'h1',
    name: 'Hub Q1',
    address: '123',
    ward: 'BN',
    district: 'Q1',
    city: 'HCM',
    latitude: 0,
    longitude: 0,
  },
  items: [
    { productId: 'p1', productName: 'Gạo', quantity: 1, unitPrice: 150000, subtotal: 150000 },
  ],
  createdAt: '2025-01-01T00:00:00Z',
};

const mockPaged = {
  items: [mockOrder],
  totalCount: 1,
  page: 1,
  pageSize: 20,
  totalPages: 1,
};

describe('AdminOrdersScreen', () => {
  beforeEach(() => {
    mockService.getOrders.mockResolvedValue(mockPaged);
  });

  it('renders loading state initially', () => {
    mockService.getOrders.mockReturnValue(new Promise(() => {}));
    const { toJSON } = render(<AdminOrdersScreen />);
    expect(toJSON()).not.toBeNull();
  });

  it('renders order list on success', async () => {
    const { getByText } = render(<AdminOrdersScreen />);
    await waitFor(() => {
      expect(getByText('150.000 ₫')).toBeTruthy();
    });
  });

  it('renders status tabs', async () => {
    const { getByText } = render(<AdminOrdersScreen />);
    await waitFor(() => {
      expect(getByText('Tất cả')).toBeTruthy();
      expect(getByText('Chờ TT')).toBeTruthy();
      expect(getByText('Đã TT')).toBeTruthy();
      expect(getByText('Hoàn thành')).toBeTruthy();
    });
  });

  it('renders empty state when no orders', async () => {
    mockService.getOrders.mockResolvedValueOnce({ ...mockPaged, items: [] });
    const { getByText } = render(<AdminOrdersScreen />);
    await waitFor(() => {
      expect(getByText('Không có đơn hàng nào')).toBeTruthy();
    });
  });

  it('renders error screen on failure', async () => {
    mockService.getOrders.mockRejectedValueOnce(new Error('Network error'));
    const { getByText } = render(<AdminOrdersScreen />);
    await waitFor(() => {
      expect(getByText('Lỗi tải dữ liệu')).toBeTruthy();
    });
  });

  it('filters by status when tab pressed', async () => {
    const { getByText } = render(<AdminOrdersScreen />);
    await waitFor(() => getByText('Hoàn thành'));
    fireEvent.press(getByText('Hoàn thành'));
    await waitFor(() => {
      expect(mockService.getOrders).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'Completed' })
      );
    });
  });

  it('returns null when unauthorized', () => {
    const { useRoleGuard } = jest.requireMock('@/lib/useRoleGuard');
    useRoleGuard.mockReturnValueOnce(true);
    const { toJSON } = render(<AdminOrdersScreen />);
    expect(toJSON()).toBeNull();
  });
});
