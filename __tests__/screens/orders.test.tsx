import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import OrdersScreen from '@/app/orders';
import { ordersService } from '@/services/orders.service';

const wrapper = ({ children }: any) => <SafeAreaProvider>{children}</SafeAreaProvider>;

jest.mock('@/services/orders.service', () => ({
  ordersService: { getMyOrders: jest.fn() },
}));
jest.mock('@/components/ErrorScreen', () => {
  const { View, Text, TouchableOpacity } = jest.requireActual('react-native');
  const ErrorScreenMock = ({ onRetry }: any) => (
    <View>
      <Text>Lỗi tải dữ liệu</Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry}>
          <Text>Thử lại</Text>
        </TouchableOpacity>
      )}
    </View>
  );
  ErrorScreenMock.displayName = 'ErrorScreen';
  return ErrorScreenMock;
});

const mockOrders = jest.mocked(ordersService);

const mockOrder = {
  id: 'o1',
  status: 'Completed' as const,
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

describe('OrdersScreen', () => {
  it('renders loading state initially', () => {
    mockOrders.getMyOrders.mockReturnValue(new Promise(() => {}));
    render(<OrdersScreen />, { wrapper });
    expect(mockOrders.getMyOrders).toHaveBeenCalled();
  });

  it('renders order list on success', async () => {
    mockOrders.getMyOrders.mockResolvedValueOnce({
      items: [mockOrder],
      totalCount: 1,
      page: 1,
      pageSize: 50,
      totalPages: 1,
    });
    const { getByText } = render(<OrdersScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText(/150[\.,]000/)).toBeTruthy();
    });
  });

  it('renders empty state when no orders', async () => {
    mockOrders.getMyOrders.mockResolvedValueOnce({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 50,
      totalPages: 1,
    });
    const { getByText } = render(<OrdersScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Chưa có đơn hàng nào')).toBeTruthy();
    });
  });

  it('renders error screen when service fails', async () => {
    mockOrders.getMyOrders.mockRejectedValueOnce(new Error('Network error'));
    const { getByText } = render(<OrdersScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Lỗi tải dữ liệu')).toBeTruthy();
    });
  });

  it('renders filter tabs', async () => {
    mockOrders.getMyOrders.mockResolvedValueOnce({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 50,
      totalPages: 1,
    });
    const { getByText } = render(<OrdersScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Tất cả')).toBeTruthy();
      expect(getByText('Hoàn thành')).toBeTruthy();
    });
  });

  it('filters by status when tab pressed', async () => {
    mockOrders.getMyOrders.mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 50,
      totalPages: 1,
    });
    const { getByText } = render(<OrdersScreen />, { wrapper });
    await waitFor(() => getByText('Hoàn thành'));
    fireEvent.press(getByText('Hoàn thành'));
    await waitFor(() => {
      expect(mockOrders.getMyOrders).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'Completed' })
      );
    });
  });
});
