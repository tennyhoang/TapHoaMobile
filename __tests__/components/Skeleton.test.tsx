import React from 'react';
import { render } from '@testing-library/react-native';
import Skeleton, { ProductCardSkeleton } from '@/components/Skeleton';

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: any) => children ?? null,
}));

describe('Skeleton', () => {
  it('renders with default props', () => {
    const { toJSON } = render(<Skeleton />);
    expect(toJSON()).not.toBeNull();
  });

  it('accepts custom width, height, borderRadius', () => {
    const { toJSON } = render(<Skeleton width={200} height={40} borderRadius={12} />);
    expect(toJSON()).not.toBeNull();
  });
});

describe('ProductCardSkeleton', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<ProductCardSkeleton />);
    expect(toJSON()).not.toBeNull();
  });
});
