import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import HelpScreen from '@/app/help/index';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('@/components/ScreenHeader', () => {
  const { Text } = require('react-native');
  return ({ title }: { title: string }) => <Text>{title}</Text>;
});

describe('HelpScreen', () => {
  it('renders the header', () => {
    const { getByText } = render(<HelpScreen />);
    expect(getByText('Hỗ trợ & FAQ')).toBeTruthy();
  });

  it('renders contact section', () => {
    const { getByText } = render(<HelpScreen />);
    expect(getByText('Email hỗ trợ')).toBeTruthy();
    expect(getByText('Hotline')).toBeTruthy();
  });

  it('renders FAQ questions', () => {
    const { getByText } = render(<HelpScreen />);
    expect(getByText('Làm sao để đặt hàng?')).toBeTruthy();
    expect(getByText('Hub là gì?')).toBeTruthy();
    expect(getByText('Tôi quên mật khẩu phải làm sao?')).toBeTruthy();
  });

  it('expands FAQ answer on press', () => {
    const { getByText, queryByText } = render(<HelpScreen />);
    const answer =
      'Chọn sản phẩm → Thêm vào giỏ hàng → Vào Giỏ hàng → Thanh toán → Chọn Hub gần nhà → Đặt hàng.';
    expect(queryByText(answer)).toBeNull();
    fireEvent.press(getByText('Làm sao để đặt hàng?'));
    expect(getByText(answer)).toBeTruthy();
  });

  it('collapses FAQ answer on second press', () => {
    const { getByText, queryByText } = render(<HelpScreen />);
    const answer =
      'Chọn sản phẩm → Thêm vào giỏ hàng → Vào Giỏ hàng → Thanh toán → Chọn Hub gần nhà → Đặt hàng.';
    fireEvent.press(getByText('Làm sao để đặt hàng?'));
    expect(getByText(answer)).toBeTruthy();
    fireEvent.press(getByText('Làm sao để đặt hàng?'));
    expect(queryByText(answer)).toBeNull();
  });

  it('shows different answer when a different FAQ is pressed', () => {
    const { getByText } = render(<HelpScreen />);
    fireEvent.press(getByText('Hub là gì?'));
    expect(getByText(/Hub là điểm giao nhận/)).toBeTruthy();
  });
});
