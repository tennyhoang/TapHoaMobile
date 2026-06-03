import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TermsScreen from '@/app/terms/page';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

describe('TermsScreen', () => {
  it('renders the title', () => {
    const { getByText } = render(<TermsScreen />);
    expect(getByText('Điều khoản sử dụng')).toBeTruthy();
  });

  it('renders all sections', () => {
    const { getByText } = render(<TermsScreen />);
    expect(getByText('1. Điều khoản sử dụng')).toBeTruthy();
    expect(getByText('2. Tài khoản người dùng')).toBeTruthy();
    expect(getByText('7. Điều khoản thay đổi')).toBeTruthy();
  });

  it('shows effective date', () => {
    const { getByText } = render(<TermsScreen />);
    expect(getByText(/01\/01\/2024/)).toBeTruthy();
  });

  it('navigates back on back button press', () => {
    const { router } = jest.requireMock('expo-router');
    const { UNSAFE_getAllByType } = render(<TermsScreen />);
    const { TouchableOpacity } = require('react-native');
    fireEvent.press(UNSAFE_getAllByType(TouchableOpacity)[0]);
    expect(router.back).toHaveBeenCalled();
  });
});
