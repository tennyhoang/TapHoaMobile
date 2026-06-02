import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TabBar from '@/components/TabBar';

jest.mock('@/lib/haptics', () => ({
  haptics: { selection: jest.fn(), light: jest.fn() },
}));

const routes = [
  { name: 'index', key: 'index-key' },
  { name: 'products', key: 'products-key' },
  { name: 'cart', key: 'cart-key' },
  { name: 'profile', key: 'profile-key' },
];

const makeProps = (activeIndex = 0, cartBadge?: number) => ({
  state: { index: activeIndex, routes },
  navigation: {
    emit: jest.fn(() => ({ defaultPrevented: false })),
    navigate: jest.fn(),
  },
  descriptors: {
    'index-key': { options: {} },
    'products-key': { options: {} },
    'cart-key': { options: cartBadge != null ? { tabBarBadge: cartBadge } : {} },
    'profile-key': { options: {} },
  },
});

describe('TabBar', () => {
  it('renders all four tab labels', () => {
    const { getByText } = render(<TabBar {...makeProps()} />);
    expect(getByText('Trang chủ')).toBeTruthy();
    expect(getByText('Sản phẩm')).toBeTruthy();
    expect(getByText('Giỏ hàng')).toBeTruthy();
    expect(getByText('Tài khoản')).toBeTruthy();
  });

  it('calls navigation.navigate when non-active tab is pressed', () => {
    const props = makeProps(0);
    const { getByText } = render(<TabBar {...props} />);
    fireEvent.press(getByText('Sản phẩm'));
    expect(props.navigation.navigate).toHaveBeenCalledWith('products');
  });

  it('does not call navigation.navigate when active tab is pressed', () => {
    const props = makeProps(0);
    const { getByText } = render(<TabBar {...props} />);
    fireEvent.press(getByText('Trang chủ'));
    expect(props.navigation.navigate).not.toHaveBeenCalled();
  });

  it('renders badge when tabBarBadge is set on cart', () => {
    const { getByText } = render(<TabBar {...makeProps(0, 5)} />);
    expect(getByText('5')).toBeTruthy();
  });

  it('renders 99+ for badge > 99', () => {
    const { getByText } = render(<TabBar {...makeProps(0, 100)} />);
    expect(getByText('99+')).toBeTruthy();
  });

  it('does not render badge when tabBarBadge is 0', () => {
    const { queryByText } = render(<TabBar {...makeProps(0, 0)} />);
    // Badge 0 is falsy — badge View should not render
    expect(queryByText('0')).toBeNull();
  });
});
