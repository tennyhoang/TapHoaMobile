import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import CartScreen from '@/app/(tabs)/cart';
import { cartService } from '@/services/cart.service';

jest.mock('@/services/cart.service', () => ({
  cartService: {
    get: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(),
  },
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

const mockCart = jest.mocked(cartService);
const wrapper = ({ children }: any) => <SafeAreaProvider>{children}</SafeAreaProvider>;

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
  it('shows loading indicator initially', () => {
    mockCart.get.mockReturnValue(new Promise(() => {}));
    const { toJSON } = render(<CartScreen />, { wrapper });
    expect(toJSON()).not.toBeNull();
    expect(mockCart.get).toHaveBeenCalled();
  });

  it('renders empty state when cart is empty', async () => {
    mockCart.get.mockResolvedValueOnce({ items: [], totalAmount: 0, totalItems: 0 });
    const { getByText } = render(<CartScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Giỏ hàng trống')).toBeTruthy();
    });
  });

  it('renders cart items when cart has products', async () => {
    mockCart.get.mockResolvedValueOnce(mockCartData);
    const { getByText } = render(<CartScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Gạo ST25')).toBeTruthy();
    });
  });

  it('renders item count in header when cart has items', async () => {
    mockCart.get.mockResolvedValueOnce(mockCartData);
    const { getByText } = render(<CartScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('2 sản phẩm')).toBeTruthy();
    });
  });

  it('renders clear cart button when cart has items', async () => {
    mockCart.get.mockResolvedValueOnce(mockCartData);
    const { getByText } = render(<CartScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Xóa tất cả')).toBeTruthy();
    });
  });

  it('calls cartService.clear when clear button is pressed', async () => {
    mockCart.get.mockResolvedValueOnce(mockCartData);
    mockCart.clear.mockResolvedValueOnce(undefined);
    const { getByText } = render(<CartScreen />, { wrapper });
    await waitFor(() => getByText('Xóa tất cả'));
    await act(async () => {
      fireEvent.press(getByText('Xóa tất cả'));
    });
    expect(mockCart.clear).toHaveBeenCalled();
  });

  it('navigates to products on "Mua sắm ngay" press', async () => {
    mockCart.get.mockResolvedValueOnce({ items: [], totalAmount: 0, totalItems: 0 });
    const { getByText } = render(<CartScreen />, { wrapper });
    await waitFor(() => getByText('Mua sắm ngay'));
    const { router } = jest.requireMock('expo-router');
    fireEvent.press(getByText('Mua sắm ngay'));
    expect(router.push).toHaveBeenCalledWith('/(tabs)/products');
  });

  it('calls cartService.update when quantity is increased', async () => {
    mockCart.get.mockResolvedValueOnce(mockCartData);
    mockCart.update.mockResolvedValueOnce(mockCartData);
    const { getByText, getAllByLabelText } = render(<CartScreen />, { wrapper });
    await waitFor(() => getByText('Gạo ST25'));
    const increaseBtn = getAllByLabelText('Tăng số lượng')[0];
    await act(async () => {
      fireEvent.press(increaseBtn);
    });
    expect(mockCart.update).toHaveBeenCalledWith('p1', 3);
  });
});
