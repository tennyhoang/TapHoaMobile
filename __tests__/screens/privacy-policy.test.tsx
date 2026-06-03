import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import PrivacyPolicyScreen from '@/app/privacy-policy/page';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

describe('PrivacyPolicyScreen', () => {
  it('renders the title', () => {
    const { getByText } = render(<PrivacyPolicyScreen />);
    expect(getByText('Chính sách bảo mật')).toBeTruthy();
  });

  it('renders all sections', () => {
    const { getByText } = render(<PrivacyPolicyScreen />);
    expect(getByText('1. Thông tin chúng tôi thu thập')).toBeTruthy();
    expect(getByText('2. Mục đích sử dụng')).toBeTruthy();
  });

  it('navigates back on back button press', () => {
    const { router } = jest.requireMock('expo-router');
    const { UNSAFE_getAllByType } = render(<PrivacyPolicyScreen />);
    const { TouchableOpacity } = require('react-native');
    fireEvent.press(UNSAFE_getAllByType(TouchableOpacity)[0]);
    expect(router.back).toHaveBeenCalled();
  });
});
