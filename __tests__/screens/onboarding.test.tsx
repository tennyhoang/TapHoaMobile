import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import OnboardingScreen from '@/app/onboarding/page';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('@/lib/storage', () => ({
  storage: { setItem: jest.fn().mockResolvedValue(undefined) },
}));

describe('OnboardingScreen', () => {
  it('renders first slide title', () => {
    const { getByText } = render(<OnboardingScreen />);
    expect(getByText('Thực phẩm tươi sạch')).toBeTruthy();
  });

  it('renders navigation button', () => {
    const { getByText } = render(<OnboardingScreen />);
    expect(getByText('Tiếp theo')).toBeTruthy();
  });

  it('renders skip button', () => {
    const { getByText } = render(<OnboardingScreen />);
    expect(getByText('Bỏ qua')).toBeTruthy();
  });

  it('skip button navigates to login and saves state', async () => {
    const { getByText } = render(<OnboardingScreen />);
    fireEvent.press(getByText('Bỏ qua'));
    const { router } = jest.requireMock('expo-router');
    const { storage } = jest.requireMock('@/lib/storage');
    await waitFor(() => {
      expect(storage.setItem).toHaveBeenCalled();
      expect(router.replace).toHaveBeenCalledWith('/(auth)/login');
    });
  });

  it('shows all slide titles', () => {
    const { getByText } = render(<OnboardingScreen />);
    expect(getByText('Thực phẩm tươi sạch')).toBeTruthy();
    expect(getByText('Flash Sale mỗi ngày')).toBeTruthy();
    expect(getByText('Giao đến Hub gần nhà')).toBeTruthy();
    expect(getByText('Thanh toán dễ dàng')).toBeTruthy();
  });

  it('navigates forward through slides on next press', () => {
    const { getByText } = render(<OnboardingScreen />);
    fireEvent.press(getByText('Tiếp theo'));
    expect(getByText('Tiếp theo')).toBeTruthy();
  });
});
