import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CartScreen from '@/app/(tabs)/cart';

const mockRefetch = jest.fn();
const mockUseCart = jest.fn();
const mockMutateAsync = jest.fn();
const mockInvalidateQueries = jest.fn();

jest.mock('@/lib/hooks', () => ({
  useCart: (...args: any[]) => mockUseCart(...args),
  useUpdateCartItem: jest.fn(() => ({ mutateAsync: mockMutateAsync })),
  useRemoveFromCart: jest.fn(() => ({ mutateAsync: mockMutateAsync })),
  useClearCart: jest.fn(() => ({ mutateAsync: mockMutateAsync })),
}));

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

jest.mock('@/lib/cart-context', () => ({
  useCartCount: () => ({ refreshCount: jest.fn() }),
}));

jest.mock('@/components/Toast', () => ({
  useToast: () => ({ show: jest.fn() }),
}));

jest.mock('@/components/ProductImage', () => {
  const { View } = jest.requireActual('react-native');
  const Mock = () => <View testID="product-image" />;
  Mock.displayName = 'ProductImage';
  return Mock;
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: any) => (
  <SafeAreaProvider>
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  </SafeAreaProvider>
);

const mockCartData = {
  items: [
    {
      productId: 'p1',
      productName: 'Gạo ST25',
      quantity: 2,
      unitPrice: 50000,
      subtotal: 100000,
      stock: 10,
      thumbnailUrl: null,
    },
  ],
  totalAmount: 100000,
  totalItems: 2,
};

describe('CartScreen', () => {
  beforeEach(() => {
    mockUseCart.mockReturnValue({
      data: null,
      isLoading: true,
      isRefetching: false,
      refetch: mockRefetch,
    });
  });

  it('shows loading indicator initially', () => {
    const { toJSON } = render(<CartScreen />, { wrapper });
    expect(toJSON()).not.toBeNull();
    expect(mockUseCart).toHaveBeenCalled();
  });

  it('renders empty state when cart is empty', async () => {
    mockUseCart.mockReturnValue({
      data: { items: [], totalAmount: 0, totalItems: 0 },
      isLoading: false,
      isRefetching: false,
      refetch: mockRefetch,
    });
    const { getByText } = render(<CartScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Giỏ hàng trống')).toBeTruthy();
    });
  });

  it('renders cart items when cart has products', async () => {
    mockUseCart.mockReturnValue({
      data: mockCartData,
      isLoading: false,
      isRefetching: false,
      refetch: mockRefetch,
    });
    const { getByText } = render(<CartScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Gạo ST25')).toBeTruthy();
    });
  });

  it('renders item count in header when cart has items', async () => {
    mockUseCart.mockReturnValue({
      data: mockCartData,
      isLoading: false,
      isRefetching: false,
      refetch: mockRefetch,
    });
    const { getByText } = render(<CartScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('2 sản phẩm')).toBeTruthy();
    });
  });

  it('renders clear cart button when cart has items', async () => {
    mockUseCart.mockReturnValue({
      data: mockCartData,
      isLoading: false,
      isRefetching: false,
      refetch: mockRefetch,
    });
    const { getByText } = render(<CartScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Xóa tất cả')).toBeTruthy();
    });
  });

  it('calls cartService.clear when clear button is pressed', async () => {
    mockUseCart.mockReturnValue({
      data: mockCartData,
      isLoading: false,
      isRefetching: false,
      refetch: mockRefetch,
    });
    mockMutateAsync.mockResolvedValueOnce(undefined);
    const { getByText } = render(<CartScreen />, { wrapper });
    await waitFor(() => getByText('Xóa tất cả'));
    await act(async () => {
      fireEvent.press(getByText('Xóa tất cả'));
    });
    expect(mockMutateAsync).toHaveBeenCalled();
  });

  it('navigates to products on "Mua sắm ngay" press', async () => {
    mockUseCart.mockReturnValue({
      data: { items: [], totalAmount: 0, totalItems: 0 },
      isLoading: false,
      isRefetching: false,
      refetch: mockRefetch,
    });
    const { getByText } = render(<CartScreen />, { wrapper });
    await waitFor(() => getByText('Mua sắm ngay'));
    const { router } = jest.requireMock('expo-router');
    fireEvent.press(getByText('Mua sắm ngay'));
    expect(router.push).toHaveBeenCalledWith('/(tabs)/products');
  });

  it('calls cartService.update when quantity is increased', async () => {
    mockUseCart.mockReturnValue({
      data: mockCartData,
      isLoading: false,
      isRefetching: false,
      refetch: mockRefetch,
    });
    mockMutateAsync.mockResolvedValueOnce(mockCartData);
    const { getByText, getAllByLabelText } = render(<CartScreen />, { wrapper });
    await waitFor(() => getByText('Gạo ST25'));
    const increaseBtn = getAllByLabelText('Tăng số lượng')[0];
    await act(async () => {
      fireEvent.press(increaseBtn);
    });
    expect(mockMutateAsync).toHaveBeenCalledWith({ productId: 'p1', quantity: 3 });
  });
});
