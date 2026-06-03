import React from 'react';
import { render } from '@testing-library/react-native';
import AdminProductsScreen from '@/app/admin/products';
import { productsService } from '@/services/products.service';

jest.mock('@/services/products.service', () => ({
  productsService: { getAll: jest.fn() },
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

const mockService = jest.mocked(productsService);

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

describe('AdminProductsScreen', () => {
  beforeEach(() => {
    mockService.getAll.mockImplementation(async ({ page }: { page?: number } = {}) =>
      page === 1 ? mockPaged : { ...mockPaged, items: [], totalCount: 0 }
    );
  });

  it('renders loading state initially', () => {
    mockService.getAll.mockReturnValue(new Promise(() => {}));
    const { toJSON } = render(<AdminProductsScreen />);
    expect(toJSON()).not.toBeNull();
  });

  it('renders product list on success', async () => {
    const { findAllByText } = render(<AdminProductsScreen />);
    const found = await findAllByText('Gạo ST25');
    expect(found.length).toBeGreaterThanOrEqual(1);
  });

  it('shows Cloudinary badge for cloudinary images', async () => {
    const { findAllByText } = render(<AdminProductsScreen />);
    const found = await findAllByText('Cloudinary ✓');
    expect(found.length).toBeGreaterThanOrEqual(1);
  });

  it('returns null when unauthorized', () => {
    const { useRoleGuard } = jest.requireMock('@/lib/useRoleGuard');
    useRoleGuard.mockReturnValueOnce(true);
    const { toJSON } = render(<AdminProductsScreen />);
    expect(toJSON()).toBeNull();
  });
});
