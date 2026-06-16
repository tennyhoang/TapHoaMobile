import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import ProductsScreen from '@/app/(tabs)/products';
import { useInfiniteProducts, useCategories, useAddToCart } from '@/lib/hooks';

jest.mock('@/lib/hooks', () => ({
  useInfiniteProducts: jest.fn(),
  useCategories: jest.fn(),
  useAddToCart: jest.fn(),
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

jest.mock('@/components/Skeleton', () => ({
  ProductCardSkeleton: () => null,
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('expo-image', () => ({
  Image: () => null,
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function renderWithQuery(component: React.ReactElement) {
  return render(
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
    </SafeAreaProvider>
  );
}

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

const defaultProductsResponse = {
  data: { pages: [mockPagedResult] },
  isLoading: false,
  isFetching: false,
  refetch: jest.fn(),
  isRefetching: false,
  fetchNextPage: jest.fn(),
  hasNextPage: false,
  isFetchingNextPage: false,
};

const defaultCategoriesResponse = {
  data: mockCategories,
};

const defaultAddToCartResponse = {
  mutateAsync: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (useInfiniteProducts as jest.Mock).mockReturnValue(defaultProductsResponse);
  (useCategories as jest.Mock).mockReturnValue(defaultCategoriesResponse);
  (useAddToCart as jest.Mock).mockReturnValue(defaultAddToCartResponse);
});

describe('ProductsScreen', () => {
  it('renders loading state initially', () => {
    (useInfiniteProducts as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: false,
      refetch: jest.fn(),
      isRefetching: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });
    const { toJSON } = renderWithQuery(<ProductsScreen />);
    expect(toJSON()).not.toBeNull();
    expect(useInfiniteProducts).toHaveBeenCalled();
  });

  it('renders product grid after data loads', async () => {
    const { getByText } = renderWithQuery(<ProductsScreen />);
    await waitFor(() => {
      expect(getByText('Gạo ST25')).toBeTruthy();
      expect(getByText('Mì Hảo Hảo')).toBeTruthy();
    });
  });

  it('shows category filter chips', async () => {
    const { getByText } = renderWithQuery(<ProductsScreen />);
    await waitFor(() => {
      expect(getByText('Tất cả')).toBeTruthy();
      expect(getByText('Gạo')).toBeTruthy();
      expect(getByText('Mì')).toBeTruthy();
    });
  });

  it('searching calls useInfiniteProducts with search term', async () => {
    const { getByPlaceholderText } = renderWithQuery(<ProductsScreen />);

    await waitFor(() => expect(useInfiniteProducts).toHaveBeenCalled());
    (useInfiniteProducts as jest.Mock).mockClear();
    (useCategories as jest.Mock).mockClear();
    (useAddToCart as jest.Mock).mockClear();

    fireEvent.changeText(getByPlaceholderText('Tìm kiếm sản phẩm...'), 'gạo');

    // Debounce is 400ms — waitFor retries for 2s with real timers
    await waitFor(
      () => {
        expect(useInfiniteProducts).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'gạo' })
        );
      },
      { timeout: 2000 }
    );
  });

  it('shows empty state when no products found', async () => {
    (useInfiniteProducts as jest.Mock).mockReturnValue({
      data: { pages: [{ items: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0 }] },
      isLoading: false,
      isFetching: false,
      refetch: jest.fn(),
      isRefetching: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });
    const { getByText } = renderWithQuery(<ProductsScreen />);
    await waitFor(() => {
      expect(getByText('Không tìm thấy sản phẩm')).toBeTruthy();
    });
  });

  it('shows "Mới" tag toggle', async () => {
    const { getByText } = renderWithQuery(<ProductsScreen />);

    await waitFor(() => {
      expect(getByText('Mới')).toBeTruthy();
    });

    (useInfiniteProducts as jest.Mock).mockClear();
    (useCategories as jest.Mock).mockClear();
    (useAddToCart as jest.Mock).mockClear();

    await act(async () => {
      fireEvent.press(getByText('Mới'));
    });

    await waitFor(() => {
      expect(useInfiniteProducts).toHaveBeenCalledWith(expect.objectContaining({ isNew: true }));
    });
  });

  it('shows "Giảm giá" tag toggle', async () => {
    const { getByText } = renderWithQuery(<ProductsScreen />);

    await waitFor(() => {
      expect(getByText('Giảm giá')).toBeTruthy();
    });

    (useInfiniteProducts as jest.Mock).mockClear();
    (useCategories as jest.Mock).mockClear();
    (useAddToCart as jest.Mock).mockClear();

    await act(async () => {
      fireEvent.press(getByText('Giảm giá'));
    });

    await waitFor(() => {
      expect(useInfiniteProducts).toHaveBeenCalledWith(
        expect.objectContaining({ isDiscount: true })
      );
    });
  });
});
