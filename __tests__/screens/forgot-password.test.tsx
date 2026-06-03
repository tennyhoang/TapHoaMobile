import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ForgotPasswordScreen from '@/app/(auth)/forgot-password';
import { authService } from '@/services/auth.service';

jest.mock('@/services/auth.service', () => ({
  authService: { forgotPassword: jest.fn() },
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const mockAuth = jest.mocked(authService);

describe('ForgotPasswordScreen', () => {
  beforeEach(() => {
    mockAuth.forgotPassword.mockRejectedValue(new Error('fail'));
  });

  it('renders email input and submit button', () => {
    const { getByPlaceholderText, getByText } = render(<ForgotPasswordScreen />);
    expect(getByPlaceholderText('you@example.com')).toBeTruthy();
    expect(getByText('Gửi link đặt lại')).toBeTruthy();
  });

  it('shows error when email is empty', async () => {
    const { getByText, findByText } = render(<ForgotPasswordScreen />);
    fireEvent.press(getByText('Gửi link đặt lại'));
    expect(await findByText('Vui lòng nhập email')).toBeTruthy();
  });

  it('shows error for invalid email format', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<ForgotPasswordScreen />);
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'notanemail');
    fireEvent.press(getByText('Gửi link đặt lại'));
    expect(await findByText('Email không hợp lệ')).toBeTruthy();
  });

  it('shows success state after sending', async () => {
    mockAuth.forgotPassword.mockResolvedValueOnce(undefined);
    const { getByPlaceholderText, getByText } = render(<ForgotPasswordScreen />);
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'test@example.com');
    fireEvent.press(getByText('Gửi link đặt lại'));
    await waitFor(() => {
      expect(mockAuth.forgotPassword).toHaveBeenCalledWith('test@example.com');
    });
    expect(getByText('Email đã được gửi!')).toBeTruthy();
  });

  it('shows error message when request fails', async () => {
    mockAuth.forgotPassword.mockRejectedValueOnce(new Error('Server error'));
    const { getByPlaceholderText, getByText, findByText } = render(<ForgotPasswordScreen />);
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'test@example.com');
    fireEvent.press(getByText('Gửi link đặt lại'));
    expect(await findByText('Server error')).toBeTruthy();
  });

  it('navigates back on back button press', () => {
    const { router } = jest.requireMock('expo-router');
    const { UNSAFE_getAllByType } = render(<ForgotPasswordScreen />);
    const { TouchableOpacity } = require('react-native');
    fireEvent.press(UNSAFE_getAllByType(TouchableOpacity)[0]);
    expect(router.back).toHaveBeenCalled();
  });

  it('navigates back on bottom link press', () => {
    const { router } = jest.requireMock('expo-router');
    const { getByText } = render(<ForgotPasswordScreen />);
    fireEvent.press(getByText('Quay lại đăng nhập'));
    expect(router.back).toHaveBeenCalled();
  });

  it('navigates to login on success card button press', async () => {
    mockAuth.forgotPassword.mockResolvedValueOnce(undefined);
    const { getByPlaceholderText, getByText } = render(<ForgotPasswordScreen />);
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'test@example.com');
    fireEvent.press(getByText('Gửi link đặt lại'));
    await waitFor(() => expect(getByText('Email đã được gửi!')).toBeTruthy());
    const { router } = jest.requireMock('expo-router');
    fireEvent.press(getByText('Quay lại đăng nhập'));
    expect(router.replace).toHaveBeenCalledWith('/(auth)/login');
  });
});
