import React from 'react';
import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import HomeScreen from '@/app/(tabs)';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
}));

jest.mock('@/lib/hooks', () => ({
  useCategories: jest.fn(),
  useCurrentFlashSale: jest.fn(),
  useArticles: jest.fn(),
  useMyOrders: jest.fn(),
  useAddToCart: jest.fn(),
  useProducts: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: jest.fn(() => ({ invalidateQueries: jest.fn() })),
}));

jest.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: { fullName: 'Nguyễn Văn A' } }),
}));

jest.mock('@/lib/layout', () => ({
  useLayout: () => ({ cardGap: 12, fontScale: 1 }),
}));

jest.mock('@/lib/cart-context', () => ({
  useCartCount: () => ({ itemCount: 3, refreshCount: jest.fn() }),
}));

jest.mock('@/lib/haptics', () => ({
  haptics: { success: jest.fn(), error: jest.fn() },
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

jest.mock('@/components/Skeleton', () => ({
  ProductCardSkeleton: () => {
    const { View } = jest.requireActual('react-native');
    return <View testID="skeleton" />;
  },
}));

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

jest.mock('expo-image', () => {
  const { View } = jest.requireActual('react-native');
  const Mock = () => <View testID="expo-image" />;
  Mock.displayName = 'ExpoImage';
  return { Image: Mock };
});

jest.mock('@/services/articles.service', () => ({
  getCategoryMeta: () => ({ label: 'Mẹo vặt', color: '#0EA5AE' }),
  getArticleImage: () => 'https://example.com/img.jpg',
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
  { id: 'cat1', name: 'Rau củ', description: '', children: [] },
  { id: 'cat2', name: 'Trái cây', description: '', children: [] },
];

const mockProducts = [
  {
    id: 'p1',
    name: 'Rau muống',
    price: 10000,
    discountPrice: null,
    stock: 10,
    thumbnailUrl: null,
    images: [],
    categoryId: 'cat1',
    categoryName: 'Rau củ',
    averageRating: 4,
    reviewCount: 5,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'p2',
    name: 'Cà chua',
    price: 15000,
    discountPrice: null,
    stock: 5,
    thumbnailUrl: null,
    images: [],
    categoryId: 'cat1',
    categoryName: 'Rau củ',
    averageRating: 3.5,
    reviewCount: 2,
    createdAt: '2025-01-01T00:00:00Z',
  },
];

const mockFlashSale = {
  sessionId: 'fs1',
  name: 'Flash Sale',
  startTime: '2025-01-01T00:00:00Z',
  endTime: '2027-01-01T00:00:00Z',
  products: [
    {
      id: 'fs-p1',
      name: 'Dâu tây',
      thumbnailUrl: null,
      categoryName: 'Trái cây',
      originalPrice: 50000,
      flashSalePrice: 30000,
      flashSaleStock: 100,
      soldCount: 30,
      stockRemaining: 70,
    },
  ],
};

const mockArticles = [
  {
    id: 'a1',
    title: 'Cách nấu canh chua',
    category: 'cooking',
    readTimeMinutes: 5,
    content: '',
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'a2',
    title: 'Mẹo chọn rau sạch',
    category: 'nutrition',
    readTimeMinutes: 3,
    content: '',
    createdAt: '2025-01-01T00:00:00Z',
  },
];

const mockActiveOrder = {
  id: 'order-1',
  status: 'ShippingToHub',
  totalAmount: 100000,
  walletAmountUsed: 0,
  hub: {
    id: 'h1',
    name: 'Hub Q1',
    address: '123',
    ward: 'Ward',
    district: 'District',
    city: 'City',
    latitude: 10,
    longitude: 106,
  },
  items: [
    { productId: 'p1', productName: 'Rau muống', quantity: 1, unitPrice: 10000, subtotal: 10000 },
  ],
  createdAt: '2025-01-01T00:00:00Z',
};

const { useCategories, useCurrentFlashSale, useArticles, useMyOrders, useAddToCart, useProducts } =
  jest.requireMock('@/lib/hooks');

jest.setTimeout(60000);

describe('HomeScreen', () => {
  beforeEach(() => {
    queryClient.clear();
    useCategories.mockReturnValue({
      data: mockCategories,
      isLoading: false,
      isRefetching: false,
    });
    useProducts.mockReturnValue({
      data: { items: mockProducts, totalCount: 2, page: 1, pageSize: 8, totalPages: 1 },
      isLoading: false,
      isRefetching: false,
    });
    useCurrentFlashSale.mockReturnValue({
      data: mockFlashSale,
      isLoading: false,
      isRefetching: false,
    });
    useArticles.mockReturnValue({
      data: mockArticles,
      isLoading: false,
      isRefetching: false,
    });
    useMyOrders.mockReturnValue({
      data: { items: [mockActiveOrder], totalCount: 1, page: 1, pageSize: 10, totalPages: 1 },
      isLoading: false,
      isRefetching: false,
    });
    useAddToCart.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });
  });

  it('renders without crashing', () => {
    useProducts.mockReturnValue({ data: undefined, isLoading: true, isRefetching: false });
    useCategories.mockReturnValue({ data: undefined, isLoading: true, isRefetching: false });
    useCurrentFlashSale.mockReturnValue({ data: undefined, isLoading: true, isRefetching: false });
    useArticles.mockReturnValue({ data: undefined, isLoading: true, isRefetching: false });
    useMyOrders.mockReturnValue({ data: undefined, isLoading: true, isRefetching: false });
    const { toJSON } = renderWithQuery(<HomeScreen />);
    expect(toJSON()).not.toBeNull();
  });

  it('renders header logo', async () => {
    const { findByText } = renderWithQuery(<HomeScreen />);
    expect(await findByText('Tạp Hóa', {}, { timeout: 20000 })).toBeTruthy();
  });

  it('renders flash sale title', async () => {
    const { findByText } = renderWithQuery(<HomeScreen />);
    expect(await findByText(/Flash Sale/, {}, { timeout: 20000 })).toBeTruthy();
  });

  it('renders active order strip', async () => {
    const { findByText } = renderWithQuery(<HomeScreen />);
    expect(await findByText('Đơn hàng đang xử lý', {}, { timeout: 20000 })).toBeTruthy();
  });

  it('renders category sections', async () => {
    const { findByText } = renderWithQuery(<HomeScreen />);
    expect(await findByText('Rau củ', {}, { timeout: 20000 })).toBeTruthy();
  });

  it('renders product list', async () => {
    const { findAllByText } = renderWithQuery(<HomeScreen />);
    const items = await findAllByText('Rau muống', {}, { timeout: 20000 });
    expect(items.length).toBeGreaterThanOrEqual(1);
  });

  it('renders flash sale section', async () => {
    const { findByText } = renderWithQuery(<HomeScreen />);
    expect(await findByText('Dâu tây', {}, { timeout: 20000 })).toBeTruthy();
  });

  it('renders articles section', async () => {
    const { findByText } = renderWithQuery(<HomeScreen />);
    expect(await findByText('Cách nấu canh chua', {}, { timeout: 20000 })).toBeTruthy();
  });

  it('renders trust badges', async () => {
    const { findByText } = renderWithQuery(<HomeScreen />);
    expect(await findByText('Kiểm định từng lô', {}, { timeout: 20000 })).toBeTruthy();
  });

  it('shows loading state with skeleton', () => {
    useProducts.mockReturnValue({ data: undefined, isLoading: true, isRefetching: false });
    useCategories.mockReturnValue({ data: undefined, isLoading: true, isRefetching: false });
    useCurrentFlashSale.mockReturnValue({ data: undefined, isLoading: true, isRefetching: false });
    useArticles.mockReturnValue({ data: undefined, isLoading: true, isRefetching: false });
    useMyOrders.mockReturnValue({ data: undefined, isLoading: true, isRefetching: false });
    const { getAllByTestId } = renderWithQuery(<HomeScreen />);
    expect(getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });
});
