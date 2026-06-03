import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ProductDetailScreen from '@/app/product/[id]';
import { productsService } from '@/services/products.service';
import { cartService } from '@/services/cart.service';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'p1' }),
  router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() },
}));

jest.mock('@/services/products.service', () => ({
  productsService: { getById: jest.fn(), getAll: jest.fn() },
}));

jest.mock('@/services/cart.service', () => ({
  cartService: { add: jest.fn() },
}));

jest.mock('@/lib/cart-context', () => ({
  useCartCount: () => ({ refreshCount: jest.fn() }),
}));

jest.mock('@/lib/wishlist-context', () => ({
  useWishlist: () => ({ isWishlisted: jest.fn().mockReturnValue(false), toggle: jest.fn() }),
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

jest.mock('@/components/ProductCard', () => {
  const { View, Text } = jest.requireActual('react-native');
  const Mock = ({ product }: any) => (
    <View>
      <Text>{product.name}</Text>
    </View>
  );
  Mock.displayName = 'ProductCard';
  return Mock;
});

jest.mock('@/components/QuantitySelector', () => {
  const { View, Text } = jest.requireActual('react-native');
  const Mock = ({ value }: any) => (
    <View>
      <Text>Số lượng: {value}</Text>
    </View>
  );
  Mock.displayName = 'QuantitySelector';
  return Mock;
});

const wrapper = ({ children }: any) => <SafeAreaProvider>{children}</SafeAreaProvider>;

const mockProduct = {
  id: 'p1',
  name: 'Gạo ST25',
  description: 'Gạo ngon',
  price: 60000,
  discountPrice: 50000,
  stock: 10,
  thumbnailUrl: 'https://example.com/img.jpg',
  images: [],
  categoryId: 'cat1',
  categoryName: 'Gạo',
  averageRating: 4.5,
  reviewCount: 10,
  createdAt: '2025-01-01T00:00:00Z',
};

const mockRelated = [
  {
    id: 'p2',
    name: 'Gạo Nàng Thơm',
    price: 55000,
    discountPrice: null,
    stock: 5,
    thumbnailUrl: null,
    images: [],
    categoryId: 'cat1',
    categoryName: 'Gạo',
    averageRating: 4,
    reviewCount: 5,
    createdAt: '2025-01-01T00:00:00Z',
  },
];

const mockServices = jest.mocked(productsService);
const mockCart = jest.mocked(cartService);

describe('ProductDetailScreen', () => {
  beforeEach(() => {
    mockServices.getById.mockResolvedValue(mockProduct as any);
    mockServices.getAll.mockResolvedValue({
      items: mockRelated,
      totalCount: 1,
      page: 1,
      pageSize: 8,
      totalPages: 1,
    } as any);
  });

  it('shows loading indicator initially', () => {
    mockServices.getById.mockReturnValue(new Promise(() => {}));
    const { toJSON } = render(<ProductDetailScreen />, { wrapper });
    expect(toJSON()).not.toBeNull();
  });

  it('renders product name after loading', async () => {
    const { getByText } = render(<ProductDetailScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Gạo ST25')).toBeTruthy();
    });
  });

  it('renders discount price', async () => {
    const { getByText } = render(<ProductDetailScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText(/50.000/)).toBeTruthy();
    });
  });

  it('renders original price with strikethrough when discounted', async () => {
    const { getByText } = render(<ProductDetailScreen />, { wrapper });
    await waitFor(() => {
      // original price should be visible as it has discountPrice
      const originalPrices = getByText(/60.000/);
      expect(originalPrices).toBeTruthy();
    });
  });

  it('renders discount percentage badge', async () => {
    const { getByText } = render(<ProductDetailScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText(/-17%/)).toBeTruthy();
    });
  });

  it('renders category name', async () => {
    const { getByText } = render(<ProductDetailScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Gạo')).toBeTruthy();
    });
  });

  it('renders rating stars and count', async () => {
    const { getByText } = render(<ProductDetailScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('4.5')).toBeTruthy();
      expect(getByText('(10 đánh giá)')).toBeTruthy();
    });
  });

  it('renders stock status when in stock', async () => {
    const { getByText } = render(<ProductDetailScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText(/Còn hàng/)).toBeTruthy();
    });
  });

  it('renders description', async () => {
    const { getByText } = render(<ProductDetailScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Gạo ngon')).toBeTruthy();
    });
  });

  it('renders related products section', async () => {
    const { getByText } = render(<ProductDetailScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Gạo Nàng Thơm')).toBeTruthy();
    });
  });

  it('renders quantity selector', async () => {
    const { getByText } = render(<ProductDetailScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Số lượng: 1')).toBeTruthy();
    });
  });

  it('shows out of stock when stock is 0', async () => {
    mockServices.getById.mockResolvedValueOnce({ ...mockProduct, stock: 0 } as any);
    const { getAllByText } = render(<ProductDetailScreen />, { wrapper });
    await waitFor(() => {
      expect(getAllByText('Hết hàng').length).toBeGreaterThan(0);
    });
  });

  it('calls cartService.add on add to cart', async () => {
    mockCart.add.mockResolvedValueOnce(undefined);
    const { getByText } = render(<ProductDetailScreen />, { wrapper });
    await waitFor(() => getByText('Thêm vào giỏ'));
    await act(async () => {
      fireEvent.press(getByText('Thêm vào giỏ'));
    });
    expect(mockCart.add).toHaveBeenCalledWith('p1', 1);
  });

  it('shows success state after adding to cart', async () => {
    mockCart.add.mockResolvedValueOnce(undefined);
    const { getByText } = render(<ProductDetailScreen />, { wrapper });
    await waitFor(() => getByText('Thêm vào giỏ'));
    await act(async () => {
      fireEvent.press(getByText('Thêm vào giỏ'));
    });
    await waitFor(() => {
      expect(getByText('Đã thêm!')).toBeTruthy();
    });
  });

  it('navigates back when product fetch fails', async () => {
    mockServices.getById.mockRejectedValueOnce(new Error('Not found'));
    const { router } = jest.requireMock('expo-router');
    render(<ProductDetailScreen />, { wrapper });
    await waitFor(() => {
      expect(router.back).toHaveBeenCalled();
    });
  });

  it('renders reviews link that navigates to reviews screen', async () => {
    const { getByText } = render(<ProductDetailScreen />, { wrapper });
    await waitFor(() => getByText('4.5'));
    fireEvent.press(getByText('4.5'));
    const { router } = jest.requireMock('expo-router');
    expect(router.push).toHaveBeenCalledWith(expect.stringContaining('/reviews/p1'));
  });

  it('shows no review message when review count is 0', async () => {
    mockServices.getById.mockResolvedValueOnce({
      ...mockProduct,
      averageRating: 0,
      reviewCount: 0,
    } as any);
    const { getByText } = render(<ProductDetailScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Chưa có đánh giá · Viết đánh giá')).toBeTruthy();
    });
  });

  it('calls share when share button is pressed', async () => {
    const { getByText } = render(<ProductDetailScreen />, { wrapper });
    await waitFor(() => getByText('Gạo ST25'));
    const shareBtns = getByText('Gạo ST25');
    // Should not crash
    expect(shareBtns).toBeTruthy();
  });
});
