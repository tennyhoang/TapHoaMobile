import React from 'react';
import { render } from '@testing-library/react-native';
import AdminProductsScreen from '@/app/admin/products/index';
import { productsService } from '@/services/products.service';
import { adminService } from '@/services/admin.service';

jest.mock('@/services/products.service', () => ({
  productsService: { getAll: jest.fn() },
}));

jest.mock('@/services/admin.service', () => ({
  adminService: {
    categories: { getAll: jest.fn() },
    products: { create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  },
}));

jest.mock('@/lib/useRoleGuard', () => ({ useRoleGuard: jest.fn().mockReturnValue(undefined) }));

const mockToastShow = jest.fn();
jest.mock('@/components/Toast', () => ({
  useToast: () => ({ show: mockToastShow }),
}));

jest.mock('@/components/ScreenHeader', () => {
  const { View, Text } = jest.requireActual('react-native');
  const Mock = ({ title }: any) => (
    <View>
      <Text>{title}</Text>
    </View>
  );
  Mock.displayName = 'ScreenHeader';
  return Mock;
});

jest.mock('@/components/ProductImage', () => {
  const { View } = jest.requireActual('react-native');
  const Mock = () => <View testID="product-image" />;
  Mock.displayName = 'ProductImage';
  return Mock;
});

const mockProductService = jest.mocked(productsService);
const mockAdminService = jest.mocked(adminService);

const mockProduct = {
  id: 'p1',
  name: 'Gạo ST25',
  price: 150000,
  discountPrice: undefined,
  stock: 10,
  thumbnailUrl: 'https://res.cloudinary.com/doy14nwx0/image/upload/v1/test.jpg',
  categoryId: 'c1',
  categoryName: 'Gạo',
  description: 'Gạo ngon',
  averageRating: 4.5,
  reviewCount: 10,
  images: [],
  createdAt: '2025-01-01T00:00:00Z',
};

const mockPaged = { items: [mockProduct], totalCount: 1, page: 1, pageSize: 50, totalPages: 1 };
const mockCategories = [{ id: 'c1', name: 'Gạo', children: [], createdAt: '' }];

describe('AdminProductsScreen', () => {
  beforeEach(() => {
    (mockProductService.getAll as jest.Mock).mockImplementation(
      async ({ page }: { page?: number } = {}) =>
        page === 1 ? mockPaged : { ...mockPaged, items: [], totalCount: 0 }
    );
    (mockAdminService.categories.getAll as jest.Mock).mockResolvedValue(mockCategories);
  });

  it('renders loading state initially', () => {
    (mockProductService.getAll as jest.Mock).mockReturnValue(new Promise(() => {}));
    const { toJSON } = render(<AdminProductsScreen />);
    expect(toJSON()).not.toBeNull();
  });

  it('renders product list on success', async () => {
    const { findAllByText } = render(<AdminProductsScreen />);
    const found = await findAllByText('Gạo ST25');
    expect(found.length).toBeGreaterThanOrEqual(1);
  });

  it('returns null when unauthorized', () => {
    const { useRoleGuard } = jest.requireMock('@/lib/useRoleGuard');
    useRoleGuard.mockReturnValueOnce(true);
    const { toJSON } = render(<AdminProductsScreen />);
    expect(toJSON()).toBeNull();
  });
});
