import React from 'react';
import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from '@/app/(tabs)';
import { productsService } from '@/services/products.service';
import { categoriesService } from '@/services/categories.service';
import { flashSaleService } from '@/services/flashsale.service';
import { ordersService } from '@/services/orders.service';
import { articlesService } from '@/services/articles.service';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
}));

jest.mock('@/services/products.service', () => ({
  productsService: { getAll: jest.fn() },
}));

jest.mock('@/services/categories.service', () => ({
  categoriesService: { getAll: jest.fn() },
}));

jest.mock('@/services/flashsale.service', () => ({
  flashSaleService: { getCurrent: jest.fn() },
}));

jest.mock('@/services/cart.service', () => ({
  cartService: { add: jest.fn() },
}));

jest.mock('@/services/orders.service', () => ({
  ordersService: { getMyOrders: jest.fn() },
}));

jest.mock('@/services/articles.service', () => ({
  articlesService: { getAll: jest.fn() },
  getCategoryMeta: () => ({ label: 'Mẹo vặt', color: '#0EA5AE' }),
  getArticleImage: () => 'https://example.com/img.jpg',
}));

jest.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: { fullName: 'Nguyễn Văn A' } }),
}));

jest.mock('@/lib/layout', () => ({
  useLayout: () => ({ cardGap: 12 }),
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

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
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

const wrapper = ({ children }: any) => <SafeAreaProvider>{children}</SafeAreaProvider>;

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

jest.setTimeout(60000);

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.mocked(productsService.getAll).mockResolvedValue({
      items: mockProducts,
      totalCount: 2,
      page: 1,
      pageSize: 8,
      totalPages: 1,
    } as any);
    jest.mocked(categoriesService.getAll).mockResolvedValue(mockCategories);
    jest.mocked(flashSaleService.getCurrent).mockResolvedValue(mockFlashSale);
    jest.mocked(ordersService.getMyOrders).mockResolvedValue({
      items: [mockActiveOrder],
      totalCount: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    } as any);
    jest.mocked(articlesService.getAll).mockResolvedValue(mockArticles);
  });

  it('renders without crashing', () => {
    jest.mocked(productsService.getAll).mockReturnValue(new Promise(() => {}));
    const { toJSON } = render(<HomeScreen />, { wrapper });
    expect(toJSON()).not.toBeNull();
  });

  it('renders greeting text', async () => {
    const { findByText } = render(<HomeScreen />, { wrapper });
    expect(await findByText(/Xin chào/, {}, { timeout: 20000 })).toBeTruthy();
  });

  it('renders hero carousel badge', async () => {
    const { findByText } = render(<HomeScreen />, { wrapper });
    expect(await findByText(/Flash Sale/, {}, { timeout: 20000 })).toBeTruthy();
  });

  it('renders active order strip', async () => {
    const { findByText } = render(<HomeScreen />, { wrapper });
    expect(await findByText('Đơn hàng đang xử lý', {}, { timeout: 20000 })).toBeTruthy();
  });

  it('renders category sections', async () => {
    const { findByText } = render(<HomeScreen />, { wrapper });
    expect(await findByText('Rau củ', {}, { timeout: 20000 })).toBeTruthy();
  });

  it('renders product list', async () => {
    const { findAllByText } = render(<HomeScreen />, { wrapper });
    const items = await findAllByText('Rau muống', {}, { timeout: 20000 });
    expect(items.length).toBeGreaterThanOrEqual(1);
  });

  it('renders flash sale section', async () => {
    const { findByText } = render(<HomeScreen />, { wrapper });
    expect(await findByText('Dâu tây', {}, { timeout: 20000 })).toBeTruthy();
  });

  it('renders articles section', async () => {
    const { findByText } = render(<HomeScreen />, { wrapper });
    expect(await findByText('Cách nấu canh chua', {}, { timeout: 20000 })).toBeTruthy();
  });

  it('renders trust badges', async () => {
    const { findByText } = render(<HomeScreen />, { wrapper });
    expect(await findByText('Kiểm định chất lượng', {}, { timeout: 20000 })).toBeTruthy();
  });

  it('shows loading state with skeleton', () => {
    jest.mocked(productsService.getAll).mockReturnValue(new Promise(() => {}));
    const { getAllByTestId } = render(<HomeScreen />, { wrapper });
    expect(getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });
});
