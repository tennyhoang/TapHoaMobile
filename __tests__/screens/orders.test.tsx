import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import OrdersScreen from '@/app/orders';

const mockRefetch = jest.fn();
const mockUseMyOrders = jest.fn();
const mockInvalidateQueries = jest.fn();

jest.mock('@/lib/hooks', () => ({
  useMyOrders: (...args: any[]) => mockUseMyOrders(...args),
}));

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
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

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: any) => (
  <SafeAreaProvider>
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  </SafeAreaProvider>
);

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
  beforeEach(() => {
    mockUseMyOrders.mockReturnValue({
      data: { items: [mockOrder], totalCount: 1, page: 1, pageSize: 50, totalPages: 1 },
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: mockRefetch,
    });
  });

  it('renders loading state initially', () => {
    mockUseMyOrders.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: false,
      isError: false,
      refetch: mockRefetch,
    });
    render(<OrdersScreen />, { wrapper });
    expect(mockUseMyOrders).toHaveBeenCalled();
  });

  it('renders order list on success', async () => {
    const { getByText } = render(<OrdersScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText(/150[\.,]000/)).toBeTruthy();
    });
  });

  it('renders empty state when no orders', async () => {
    mockUseMyOrders.mockReturnValue({
      data: { items: [], totalCount: 0, page: 1, pageSize: 50, totalPages: 1 },
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: mockRefetch,
    });
    const { getByText } = render(<OrdersScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Chưa có đơn hàng nào')).toBeTruthy();
    });
  });

  it('renders error screen when service fails', async () => {
    mockUseMyOrders.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: true,
      refetch: mockRefetch,
    });
    const { getByText } = render(<OrdersScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Lỗi tải dữ liệu')).toBeTruthy();
    });
  });

  it('renders filter tabs', async () => {
    mockUseMyOrders.mockReturnValue({
      data: { items: [], totalCount: 0, page: 1, pageSize: 50, totalPages: 1 },
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: mockRefetch,
    });
    const { getByText } = render(<OrdersScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Tất cả')).toBeTruthy();
      expect(getByText('Chờ XN')).toBeTruthy();
      expect(getByText('Hoàn thành')).toBeTruthy();
    });
  });

  it('filters by status when tab pressed', async () => {
    mockUseMyOrders.mockReturnValue({
      data: { items: [], totalCount: 0, page: 1, pageSize: 50, totalPages: 1 },
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: mockRefetch,
    });
    const { getByText } = render(<OrdersScreen />, { wrapper });
    await waitFor(() => getByText('Hoàn thành'));
    fireEvent.press(getByText('Hoàn thành'));
    await waitFor(() => {
      expect(mockUseMyOrders).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'Completed' })
      );
    });
  });
});
