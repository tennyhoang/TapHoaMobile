import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import OrderDetailScreen from '@/app/order/[id]/index';
import { ordersService } from '@/services/orders.service';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn() },
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ id: 'order-1' }),
  useFocusEffect: (cb: any) => {
    cb();
  },
  Redirect: () => null,
  Stack: { Screen: () => null },
  Link: ({ children }: any) => children,
}));

jest.mock('@/services/orders.service', () => ({
  ordersService: {
    getById: jest.fn(),
    cancel: jest.fn(),
    requestRefund: jest.fn(),
  },
}));

jest.mock('expo-screen-capture', () => ({
  preventScreenCaptureAsync: jest.fn(),
  allowScreenCaptureAsync: jest.fn(),
}));

jest.mock('expo-store-review', () => ({
  hasAction: jest.fn().mockResolvedValue(false),
  requestReview: jest.fn(),
}));

jest.mock('@/components/ScreenHeader', () => {
  const { View, Text } = jest.requireActual('react-native');
  const Mock = ({ title }: { title: string }) => (
    <View>
      <Text>{title}</Text>
    </View>
  );
  Mock.displayName = 'ScreenHeader';
  return Mock;
});

jest.mock('@/components/Toast', () => ({
  useToast: () => ({ show: jest.fn() }),
}));

const wrapper = ({ children }: any) => <SafeAreaProvider>{children}</SafeAreaProvider>;

const mockHub = {
  id: 'h1',
  name: 'Hub Quận 1',
  address: '10 Lê Lợi',
  ward: 'Bến Nghé',
  district: 'Quận 1',
  city: 'TP.HCM',
  latitude: 10.77,
  longitude: 106.69,
};

const baseOrder = {
  id: 'order-1',
  status: 'Completed' as const,
  totalAmount: 150000,
  walletAmountUsed: 0,
  hub: mockHub,
  items: [
    { productId: 'p1', productName: 'Gạo ST25', quantity: 2, unitPrice: 50000, subtotal: 100000 },
  ],
  createdAt: '2025-01-01T08:00:00Z',
  paymentRef: undefined,
  cancelReason: undefined,
  cancelledAt: undefined,
  refundedAt: undefined,
  note: undefined,
};

const mockOrders = jest.mocked(ordersService);

describe('OrderDetailScreen', () => {
  it('shows loading indicator initially', () => {
    mockOrders.getById.mockReturnValue(new Promise(() => {}));
    const { toJSON } = render(<OrderDetailScreen />, { wrapper });
    expect(toJSON()).not.toBeNull();
    expect(mockOrders.getById).toHaveBeenCalledWith('order-1');
  });

  it('renders order detail after loading', async () => {
    mockOrders.getById.mockResolvedValueOnce(baseOrder as any);
    const { getByText } = render(<OrderDetailScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Chi tiết đơn hàng')).toBeTruthy();
    });
  });

  it('renders status label', async () => {
    mockOrders.getById.mockResolvedValueOnce(baseOrder as any);
    const { getAllByText } = render(<OrderDetailScreen />, { wrapper });
    await waitFor(() => {
      expect(getAllByText('Hoàn thành').length).toBeGreaterThan(0);
    });
  });

  it('renders hub name', async () => {
    mockOrders.getById.mockResolvedValueOnce(baseOrder as any);
    const { getByText } = render(<OrderDetailScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Hub Quận 1')).toBeTruthy();
    });
  });

  it('renders item name and quantity', async () => {
    mockOrders.getById.mockResolvedValueOnce(baseOrder as any);
    const { getByText } = render(<OrderDetailScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Gạo ST25')).toBeTruthy();
      expect(getByText('x2')).toBeTruthy();
    });
  });

  it('renders cancel button for cancellable orders', async () => {
    const order = { ...baseOrder, status: 'PendingPayment' as const };
    mockOrders.getById.mockResolvedValueOnce(order as any);
    const { getByText } = render(<OrderDetailScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Huỷ đơn hàng')).toBeTruthy();
    });
  });

  it('does not render cancel button for completed orders', async () => {
    mockOrders.getById.mockResolvedValueOnce(baseOrder as any);
    const { queryByText } = render(<OrderDetailScreen />, { wrapper });
    await waitFor(() => queryByText('Hoàn thành'));
    expect(queryByText('Huỷ đơn hàng')).toBeNull();
  });

  it('shows Alert when cancel button is pressed', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const order = { ...baseOrder, status: 'PendingPayment' as const };
    mockOrders.getById.mockResolvedValueOnce(order as any);
    const { getByText } = render(<OrderDetailScreen />, { wrapper });
    await waitFor(() => getByText('Huỷ đơn hàng'));
    fireEvent.press(getByText('Huỷ đơn hàng'));
    expect(alertSpy).toHaveBeenCalledWith(
      'Huỷ đơn hàng',
      'Bạn có chắc muốn huỷ đơn hàng này?',
      expect.any(Array)
    );
    alertSpy.mockRestore();
  });

  it('renders QR payment section for PendingPayment with paymentRef', async () => {
    const order = { ...baseOrder, status: 'PendingPayment' as const, paymentRef: 'REF123' };
    mockOrders.getById.mockResolvedValueOnce(order as any);
    const { getByText } = render(<OrderDetailScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Quét mã để chuyển khoản')).toBeTruthy();
    });
  });

  it('renders timeline section', async () => {
    mockOrders.getById.mockResolvedValueOnce(baseOrder as any);
    const { getByText } = render(<OrderDetailScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Tiến trình đơn hàng')).toBeTruthy();
    });
  });

  it('navigates back when order fetch fails', async () => {
    mockOrders.getById.mockRejectedValueOnce(new Error('Not found'));
    const { router } = jest.requireMock('expo-router');
    render(<OrderDetailScreen />, { wrapper });
    await waitFor(() => {
      expect(router.back).toHaveBeenCalled();
    });
  });
});
