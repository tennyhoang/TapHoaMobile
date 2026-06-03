import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import DriverScreen from '@/app/driver/index/index';
import { driverService } from '@/services/driver.service';

jest.mock('@/services/driver.service', () => ({
  driverService: {
    getMyWarehouse: jest.fn(),
    getOrders: jest.fn(),
    getShippingOrders: jest.fn(),
    getCompletedOrders: jest.fn(),
    pickupOrders: jest.fn(),
    optimizeRoute: jest.fn(),
  },
}));

jest.mock('@/lib/useRoleGuard', () => ({ useRoleGuard: jest.fn().mockReturnValue(undefined) }));

const mockToastShow = jest.fn();
jest.mock('@/components/Toast', () => ({
  useToast: () => ({ show: mockToastShow }),
}));

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
}));

const wrapper = ({ children }: any) => <SafeAreaProvider>{children}</SafeAreaProvider>;

const mockService = jest.mocked(driverService);

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

const mockBatch = {
  hubId: 'h1',
  hubName: 'Hub Q1',
  hubFullAddress: '123, BN, Q1, HCM',
  orderCount: 1,
  totalAmount: 150000,
  orders: [mockOrder],
};

describe('DriverScreen', () => {
  beforeEach(() => {
    mockService.getMyWarehouse.mockResolvedValue({
      id: 'w1',
      name: 'Kho A',
      fullAddress: '456 Kho, Q1, HCM',
      phoneNumber: '0901234567',
    });
    mockService.getOrders.mockResolvedValue([mockBatch]);
    mockService.getShippingOrders.mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 50,
      totalPages: 1,
    });
    mockService.getCompletedOrders.mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 30,
      totalPages: 1,
    });
  });

  it('renders loading state initially', () => {
    mockService.getOrders.mockReturnValue(new Promise(() => {}));
    const { toJSON } = render(<DriverScreen />, { wrapper });
    expect(toJSON()).not.toBeNull();
  });

  it('renders driver portal header', async () => {
    const { getByText } = render(<DriverScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Cổng Tài xế')).toBeTruthy();
    });
  });

  it('renders pickup orders by default', async () => {
    const { getByText } = render(<DriverScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Hub Q1')).toBeTruthy();
    });
  });

  it('renders tab bar', async () => {
    const { getByText } = render(<DriverScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Cần lấy')).toBeTruthy();
      expect(getByText('Đang giao')).toBeTruthy();
      expect(getByText('Hôm nay')).toBeTruthy();
      expect(getByText('Lộ trình')).toBeTruthy();
    });
  });

  it('renders empty state when no pickup orders', async () => {
    mockService.getOrders.mockResolvedValueOnce([]);
    const { getByText } = render(<DriverScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Không có đơn cần lấy')).toBeTruthy();
    });
  });

  it('renders transit tab with orders', async () => {
    mockService.getShippingOrders.mockResolvedValueOnce({
      items: [mockOrder],
      totalCount: 1,
      page: 1,
      pageSize: 50,
      totalPages: 1,
    });
    const { getByText } = render(<DriverScreen />, { wrapper });
    await waitFor(() => getByText('Đang giao'));
    fireEvent.press(getByText('Đang giao'));
    await waitFor(() => {
      expect(getByText('#O1')).toBeTruthy();
    });
  });

  it('renders empty state for transit tab', async () => {
    const { getByText } = render(<DriverScreen />, { wrapper });
    await waitFor(() => getByText('Đang giao'));
    fireEvent.press(getByText('Đang giao'));
    await waitFor(() => {
      expect(getByText('Chưa có đơn đang giao')).toBeTruthy();
    });
  });

  it('renders history tab', async () => {
    const { getByText } = render(<DriverScreen />, { wrapper });
    await waitFor(() => getByText('Hôm nay'));
    fireEvent.press(getByText('Hôm nay'));
    await waitFor(() => {
      expect(getByText('Chưa có đơn hoàn thành hôm nay')).toBeTruthy();
    });
  });

  it('renders route tab', async () => {
    const { getByText } = render(<DriverScreen />, { wrapper });
    await waitFor(() => getByText('Lộ trình'));
    fireEvent.press(getByText('Lộ trình'));
    await waitFor(() => {
      expect(getByText('Chọn Hub cần giao')).toBeTruthy();
      expect(getByText('Kho xuất phát')).toBeTruthy();
      expect(getByText('Kho A')).toBeTruthy();
    });
  });

  it('returns null when unauthorized', () => {
    const { useRoleGuard } = jest.requireMock('@/lib/useRoleGuard');
    useRoleGuard.mockReturnValueOnce(true);
    const { toJSON } = render(<DriverScreen />, { wrapper });
    expect(toJSON()).toBeNull();
  });
});
