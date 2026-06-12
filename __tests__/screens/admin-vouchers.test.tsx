import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AdminVouchersScreen from '@/app/admin/vouchers/index';
import { adminService } from '@/services/admin.service';
import type { AdminVoucher } from '@/types';

jest.mock('@/services/admin.service', () => ({
  adminService: {
    vouchers: {
      getAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('@/lib/useRoleGuard', () => ({ useRoleGuard: jest.fn().mockReturnValue(false) }));

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

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('@/components/KeyboardAwareScreen', () => {
  const { View } = jest.requireActual('react-native');
  const Mock = ({ children, style }: any) => <View style={style}>{children}</View>;
  Mock.displayName = 'KeyboardAwareScreen';
  return Mock;
});

jest.mock('@/lib/utils', () => ({
  formatCurrency: (v: number) => `${v.toLocaleString('vi-VN')} ₫`,
}));

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

const mockVouchers: AdminVoucher[] = [
  {
    id: '1',
    code: 'SALE20',
    type: 'percent',
    value: 20,
    minOrder: 100000,
    maxDiscount: 50000,
    usageLimit: 100,
    usedCount: 10,
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
    isActive: true,
    description: '20% off',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '2',
    code: 'FLAT50',
    type: 'flat',
    value: 50000,
    minOrder: 200000,
    usageLimit: 50,
    usedCount: 25,
    startDate: '2026-06-01T00:00:00Z',
    endDate: '2026-07-01T00:00:00Z',
    isActive: false,
    createdAt: '2026-06-01T00:00:00Z',
  },
];

const mockService = jest.mocked(adminService);

describe('AdminVouchersScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockService.vouchers.getAll.mockResolvedValue(mockVouchers);
  });

  it('renders list of vouchers', async () => {
    const { getByText } = render(<AdminVouchersScreen />);
    await waitFor(() => {
      expect(getByText('SALE20')).toBeTruthy();
      expect(getByText('FLAT50')).toBeTruthy();
    });
  });

  it('shows empty state when no vouchers', async () => {
    mockService.vouchers.getAll.mockResolvedValue([]);
    const { getByText } = render(<AdminVouchersScreen />);
    await waitFor(() => {
      expect(getByText('Chưa có voucher nào')).toBeTruthy();
    });
  });

  it('handles load error gracefully', async () => {
    mockService.vouchers.getAll.mockRejectedValue(new Error('fail'));
    render(<AdminVouchersScreen />);
    await waitFor(() => {
      expect(mockToastShow).toHaveBeenCalledWith('Không thể tải danh sách voucher', 'error');
    });
  });

  it('returns null when unauthorized', () => {
    const { useRoleGuard } = jest.requireMock('@/lib/useRoleGuard');
    useRoleGuard.mockReturnValueOnce(true);
    const { toJSON } = render(<AdminVouchersScreen />);
    expect(toJSON()).toBeNull();
  });

  it('calls delete service when delete confirmed', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
      const deleteBtn = buttons?.find(b => b.text === 'Xoá');
      if (deleteBtn?.onPress) deleteBtn.onPress();
    });
    mockService.vouchers.delete.mockResolvedValue(undefined);
    const { getByText, getAllByText } = render(<AdminVouchersScreen />);
    await waitFor(() => getByText('SALE20'));
    fireEvent.press(getAllByText('Xoá')[0]);
    await waitFor(() => {
      expect(mockService.vouchers.delete).toHaveBeenCalledWith('1');
    });
  });
});
