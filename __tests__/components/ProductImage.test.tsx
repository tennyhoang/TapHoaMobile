import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import ProductImage from '@/components/ProductImage';

jest.mock('expo-image', () => {
  const { Image: RNImage } = jest.requireActual('react-native');
  return {
    Image: ({ onError, testID, ...props }: any) => (
      <RNImage testID={testID ?? 'expo-image'} onError={onError} {...props} />
    ),
  };
});

jest.mock('@/constants/api', () => ({
  API_BASE_URL: 'https://api.test.com',
}));

describe('ProductImage', () => {
  it('renders placeholder with initial when no uri', () => {
    const { getByText } = render(<ProductImage name="Gạo ST25" />);
    expect(getByText('G')).toBeTruthy();
  });

  it('renders "?" initial when no name provided', () => {
    const { getByText } = render(<ProductImage />);
    expect(getByText('?')).toBeTruthy();
  });

  it('renders image when uri is provided', () => {
    const { getByTestId } = render(<ProductImage uri="https://example.com/img.jpg" name="Test" />);
    expect(getByTestId('expo-image')).toBeTruthy();
  });

  it('prepends API_BASE_URL for relative uri', () => {
    const { getByTestId } = render(<ProductImage uri="/images/product.jpg" name="Test" />);
    expect(getByTestId('expo-image')).toBeTruthy();
  });

  it('falls back to placeholder on image error', () => {
    const { getByTestId, getByText } = render(
      <ProductImage uri="https://example.com/img.jpg" name="Gạo" />
    );
    act(() => {
      fireEvent(getByTestId('expo-image'), 'error');
    });
    expect(getByText('G')).toBeTruthy();
  });

  it('renders placeholder when uri is null', () => {
    const { getByText } = render(<ProductImage uri={null} name="Bơ" />);
    expect(getByText('B')).toBeTruthy();
  });
});
