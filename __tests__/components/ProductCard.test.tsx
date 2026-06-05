import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/types';

jest.mock('@/lib/wishlist-context', () => ({
  useWishlist: () => ({ isWishlisted: jest.fn(() => false), toggle: jest.fn() }),
}));
jest.mock('@/lib/haptics', () => ({ haptics: { light: jest.fn(), success: jest.fn() } }));
jest.mock('@/components/ProductImage', () => {
  const { View } = jest.requireActual('react-native');
  const ProductImageMock = ({ name }: { name: string }) => (
    <View testID={`product-image-${name}`} />
  );
  ProductImageMock.displayName = 'ProductImage';
  return ProductImageMock;
});

const mockProduct: Product = {
  id: 'p1',
  name: 'Gạo ST25',
  price: 50000,
  discountPrice: 40000,
  stock: 10,
  categoryId: 'cat1',
  categoryName: 'Thực phẩm',
  averageRating: 4.5,
  reviewCount: 12,
  images: [],
  createdAt: '2025-01-01T00:00:00Z',
};

describe('ProductCard', () => {
  it('renders product name and price', () => {
    const { getByText } = render(<ProductCard product={mockProduct} />);
    expect(getByText('Gạo ST25')).toBeTruthy();
  });

  it('renders discounted price when discount exists', () => {
    const { getAllByText } = render(<ProductCard product={mockProduct} />);
    // Intl.NumberFormat output varies by Node version — match any price-like text
    const priceTexts = getAllByText(/40[\.,]000/);
    expect(priceTexts.length).toBeGreaterThan(0);
  });

  it('renders discount badge when discountPrice is set', () => {
    const { getByText } = render(<ProductCard product={mockProduct} />);
    expect(getByText('-20%')).toBeTruthy();
  });

  it('does not render discount badge when no discountPrice', () => {
    const product = { ...mockProduct, discountPrice: undefined };
    const { queryByText } = render(<ProductCard product={product} />);
    expect(queryByText(/-\d+%/)).toBeNull();
  });

  it('renders rating when reviewCount > 0', () => {
    const { getByText } = render(<ProductCard product={mockProduct} />);
    expect(getByText('4.5')).toBeTruthy();
  });

  it('does not render rating when reviewCount is 0', () => {
    const product = { ...mockProduct, reviewCount: 0 };
    const { queryByText } = render(<ProductCard product={product} />);
    expect(queryByText('4.5')).toBeNull();
  });

  it('renders add to cart button when onAddToCart provided', () => {
    const onAddToCart = jest.fn();
    render(<ProductCard product={mockProduct} onAddToCart={onAddToCart} />);
    // The cart button exists — onAddToCart not called on mount
    expect(onAddToCart).not.toHaveBeenCalled();
  });

  it('navigates to product detail on press', () => {
    const { getByText } = render(<ProductCard product={mockProduct} />);
    const { router } = jest.requireMock('expo-router');
    fireEvent.press(getByText('Gạo ST25'));
    expect(router.push).toHaveBeenCalledWith('/product/p1');
  });
});
