import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProductsScreen from '@/app/(tabs)/products';
import { productsService } from '@/services/products.service';
import { categoriesService } from '@/services/categories.service';

jest.mock('@/services/products.service', () => ({
  productsService: { getAll: jest.fn() },
}));

jest.mock('@/services/categories.service', () => ({
  categoriesService: { getAll: jest.fn() },
}));

jest.mock('@/services/cart.service', () => ({
  cartService: { add: jest.fn() },
}));

jest.mock('@/components/Toast', () => ({
  useToast: () => ({ show: jest.fn() }),
}));

jest.mock('@/lib/layout', () => ({
  useLayout: () => ({ productColumns: 2, cardGap: 12 }),
}));

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

jest.mock('@/lib/cart-context', () => ({
  useCartCount: () => ({ refreshCount: jest.fn() }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('expo-image', () => ({
  Image: () => null,
}));

let queryClient: QueryClient;
const wrapper = ({ children }: any) => (
  <QueryClientProvider client={queryClient}>
    <SafeAreaProvider>{children}</SafeAreaProvider>
  </QueryClientProvider>
);

const mockCategories = [
  { id: 'cat1', name: 'Gạo', children: [] },
  { id: 'cat2', name: 'Mì', children: [] },
];

const mockProducts = [
  {
    id: 'p1',
    name: 'Gạo ST25',
    price: 50000,
    discountPrice: null,
    stock: 10,
    thumbnailUrl: null,
    images: [],
    categoryId: 'cat1',
    categoryName: 'Gạo',
    averageRating: 4.5,
    reviewCount: 10,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'p2',
    name: 'Mì Hảo Hảo',
    price: 5000,
    discountPrice: 4000,
    stock: 100,
    thumbnailUrl: null,
    images: [],
    categoryId: 'cat2',
    categoryName: 'Mì',
    averageRating: 4,
    reviewCount: 20,
    createdAt: '2025-01-02T00:00:00Z',
  },
];

const mockPagedResult = {
  items: mockProducts,
  totalCount: 2,
  page: 1,
  pageSize: 20,
  totalPages: 1,
};

describe('ProductsScreen', () => {
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 0, gcTime: 0 } },
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('renders loading state initially', () => {
    (productsService.getAll as jest.Mock).mockReturnValue(new Promise(() => {}));
    (categoriesService.getAll as jest.Mock).mockReturnValue(new Promise(() => {}));
    const { toJSON } = render(<ProductsScreen />, { wrapper });
    expect(toJSON()).not.toBeNull();
    expect(productsService.getAll).toHaveBeenCalled();
  });

  it('renders product grid after data loads', async () => {
    (productsService.getAll as jest.Mock).mockResolvedValue(mockPagedResult);
    (categoriesService.getAll as jest.Mock).mockResolvedValue(mockCategories);
    const { getByText } = render(<ProductsScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Gạo ST25')).toBeTruthy();
      expect(getByText('Mì Hảo Hảo')).toBeTruthy();
    });
  });

  it('shows category filter chips', async () => {
    (productsService.getAll as jest.Mock).mockResolvedValue(mockPagedResult);
    (categoriesService.getAll as jest.Mock).mockResolvedValue(mockCategories);
    const { getByText } = render(<ProductsScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Tất cả')).toBeTruthy();
      expect(getByText('Gạo')).toBeTruthy();
      expect(getByText('Mì')).toBeTruthy();
    });
  });

  it('searching calls productsService.getAll with search term', async () => {
    jest.useFakeTimers();
    (productsService.getAll as jest.Mock).mockResolvedValue(mockPagedResult);
    (categoriesService.getAll as jest.Mock).mockResolvedValue(mockCategories);
    const { getByPlaceholderText } = render(<ProductsScreen />, { wrapper });

    await waitFor(() => {
      expect(productsService.getAll).toHaveBeenCalled();
    });

    (productsService.getAll as jest.Mock).mockClear();

    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('Tìm kiếm sản phẩm...'), 'gạo');
    });

    await act(async () => {
      jest.advanceTimersByTime(400);
    });

    await waitFor(() => {
      expect(productsService.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'gạo' })
      );
    });

    jest.useRealTimers();
  });

  it('shows empty state when no products found', async () => {
    (productsService.getAll as jest.Mock).mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    });
    (categoriesService.getAll as jest.Mock).mockResolvedValue(mockCategories);
    const { getByText } = render(<ProductsScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Không tìm thấy sản phẩm')).toBeTruthy();
    });
  });

  it('shows "Mới" tag toggle', async () => {
    (productsService.getAll as jest.Mock).mockResolvedValue(mockPagedResult);
    (categoriesService.getAll as jest.Mock).mockResolvedValue(mockCategories);
    const { getByText } = render(<ProductsScreen />, { wrapper });

    await waitFor(() => {
      expect(getByText('Mới')).toBeTruthy();
    });

    (productsService.getAll as jest.Mock).mockClear();

    await act(async () => {
      fireEvent.press(getByText('Mới'));
    });

    await waitFor(() => {
      expect(productsService.getAll).toHaveBeenCalledWith(expect.objectContaining({ isNew: true }));
    });
  });

  it('shows "Giảm giá" tag toggle', async () => {
    (productsService.getAll as jest.Mock).mockResolvedValue(mockPagedResult);
    (categoriesService.getAll as jest.Mock).mockResolvedValue(mockCategories);
    const { getByText } = render(<ProductsScreen />, { wrapper });

    await waitFor(() => {
      expect(getByText('Giảm giá')).toBeTruthy();
    });

    (productsService.getAll as jest.Mock).mockClear();

    await act(async () => {
      fireEvent.press(getByText('Giảm giá'));
    });

    await waitFor(() => {
      expect(productsService.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ isDiscount: true })
      );
    });
  });
});
