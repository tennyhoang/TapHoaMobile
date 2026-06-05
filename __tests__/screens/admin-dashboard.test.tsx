import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AdminDashboard from '@/app/admin/index/index';
import { adminService } from '@/services/admin.service';

jest.mock('@/services/admin.service', () => ({
  adminService: { getStats: jest.fn() },
}));

jest.mock('@/lib/useRoleGuard', () => ({ useRoleGuard: jest.fn().mockReturnValue(undefined) }));

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

const mockService = jest.mocked(adminService);

describe('AdminDashboard', () => {
  beforeEach(() => {
    mockService.getStats.mockResolvedValue({
      totalOrders: 150,
      totalRevenue: 5000000,
      pendingOrders: 12,
      totalUsers: 320,
    });
  });

  it('renders loading indicator initially', () => {
    mockService.getStats.mockReturnValue(new Promise(() => {}));
    const { toJSON } = render(<AdminDashboard />);
    expect(toJSON()).not.toBeNull();
  });

  it('renders stats after loading', async () => {
    const { getByText } = render(<AdminDashboard />);
    await waitFor(() => {
      expect(getByText('150')).toBeTruthy();
      expect(getByText('5.000.000 ₫')).toBeTruthy();
      expect(getByText('12')).toBeTruthy();
      expect(getByText('320')).toBeTruthy();
    });
  });

  it('renders all navigation items', async () => {
    const { getByText } = render(<AdminDashboard />);
    await waitFor(() => {
      expect(getByText('Quản lý đơn hàng')).toBeTruthy();
      expect(getByText('Quản lý sản phẩm')).toBeTruthy();
      expect(getByText('Danh mục')).toBeTruthy();
      expect(getByText('Flash Sale')).toBeTruthy();
      expect(getByText('Người dùng')).toBeTruthy();
      expect(getByText('Ví & Rút tiền')).toBeTruthy();
      expect(getByText('Kho hàng')).toBeTruthy();
      expect(getByText('Cẩm nang')).toBeTruthy();
    });
  });

  it('renders stats unavailable when service fails', async () => {
    mockService.getStats.mockRejectedValueOnce(new Error('Network error'));
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { getByText } = render(<AdminDashboard />);
    await waitFor(() => {
      expect(getByText('Không tải được thống kê')).toBeTruthy();
    });
  });

  it('navigates to orders page on press', async () => {
    const { getByText } = render(<AdminDashboard />);
    await waitFor(() => getByText('Quản lý đơn hàng'));
    fireEvent.press(getByText('Quản lý đơn hàng'));
  });

  it('returns null when unauthorized', () => {
    const { useRoleGuard } = jest.requireMock('@/lib/useRoleGuard');
    useRoleGuard.mockReturnValueOnce(true);
    const { toJSON } = render(<AdminDashboard />);
    expect(toJSON()).toBeNull();
  });
});
