import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import WishlistScreen from '@/app/wishlist/page';
import { productsService } from '@/services/products.service';
import { cartService } from '@/services/cart.service';

const mockUseWishlist = jest.fn();
jest.mock('@/lib/wishlist-context', () => ({
  useWishlist: () => mockUseWishlist(),
}));

jest.mock('@/services/products.service', () => ({
  productsService: { getById: jest.fn() },
}));

jest.mock('@/services/cart.service', () => ({
  cartService: { add: jest.fn() },
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('expo-image', () => ({
  Image: () => null,
}));

const mockProducts = jest.mocked(productsService);
const mockCart = jest.mocked(cartService);
const mockToggle = jest.fn();
const wrapper = ({ children }: any) => <SafeAreaProvider>{children}</SafeAreaProvider>;

const product1 = {
  id: 'p1',
  name: 'Gạo ST25',
  price: 50000,
  discountPrice: 45000,
  thumbnailUrl: null,
  categoryId: 'c1',
  categoryName: 'Gạo',
  averageRating: 4.5,
  reviewCount: 100,
  stock: 10,
  images: [],
  createdAt: '2024-01-01',
};

const product2 = {
  id: 'p2',
  name: 'Nước mắm Phú Quốc',
  price: 35000,
  discountPrice: undefined,
  thumbnailUrl: null,
  categoryId: 'c2',
  categoryName: 'Nước mắm',
  averageRating: 4.0,
  reviewCount: 50,
  stock: 5,
  images: [],
  createdAt: '2024-01-02',
};

describe('WishlistScreen', () => {
  beforeEach(() => {
    mockUseWishlist.mockReturnValue({ ids: ['p1'], toggle: mockToggle, isWishlisted: jest.fn() });
    mockProducts.getById.mockResolvedValue(product1);
    mockCart.add.mockResolvedValue({} as any);
  });

  it('shows loading state while fetching products', () => {
    mockProducts.getById.mockReturnValue(new Promise(() => {}));
    const { queryByText } = render(<WishlistScreen />, { wrapper });
    expect(queryByText('Chưa có sản phẩm yêu thích')).toBeNull();
    expect(mockProducts.getById).toHaveBeenCalledWith('p1');
  });

  it('renders empty state when wishlist is empty', async () => {
    mockUseWishlist.mockReturnValue({ ids: [], toggle: mockToggle, isWishlisted: jest.fn() });
    const { getByText } = render(<WishlistScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Chưa có sản phẩm yêu thích')).toBeTruthy();
    });
  });

  it('renders wishlist items when products are loaded', async () => {
    mockUseWishlist.mockReturnValue({
      ids: ['p1', 'p2'],
      toggle: mockToggle,
      isWishlisted: jest.fn(),
    });
    mockProducts.getById.mockResolvedValueOnce(product1);
    mockProducts.getById.mockResolvedValueOnce(product2);
    const { getByText } = render(<WishlistScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Gạo ST25')).toBeTruthy();
      expect(getByText('Nước mắm Phú Quốc')).toBeTruthy();
    });
  });

  it('navigates to product detail on card press', async () => {
    const { getByText } = render(<WishlistScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Gạo ST25')).toBeTruthy();
    });
    fireEvent.press(getByText('Gạo ST25'));
    const { router } = jest.requireMock('expo-router');
    expect(router.push).toHaveBeenCalledWith('/product/p1');
  });

  it('removes item from wishlist on remove button press', async () => {
    const localToggle = jest.fn();
    mockUseWishlist.mockReturnValue({ ids: ['p1'], toggle: localToggle, isWishlisted: jest.fn() });
    const { UNSAFE_root, getByText } = render(<WishlistScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Gạo ST25')).toBeTruthy();
    });
    const pressables = UNSAFE_root.findAll((el: any) => typeof el.props.onPress === 'function');
    const removeBtn = pressables.find(
      (el: any) =>
        String(el.props.onPress).includes('handleRemove') ||
        String(el.props.onPress).includes('remove')
    );
    if (!removeBtn) {
      pressables.forEach((_el: any, _i: number) => {});
    }
    expect(removeBtn).toBeDefined();
    act(() => {
      removeBtn.props.onPress();
    });
    expect(localToggle).toHaveBeenCalledWith('p1');
  });
});
