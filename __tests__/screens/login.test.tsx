import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '@/app/(auth)/login';
import { authService } from '@/services/auth.service';

jest.mock('@/services/auth.service', () => ({
  authService: { login: jest.fn(), socialLogin: jest.fn() },
}));
jest.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ login: jest.fn() }),
}));
jest.mock('expo-auth-session/providers/google', () => ({
  useAuthRequest: () => [null, null, jest.fn()],
}));
jest.mock('expo-auth-session/providers/facebook', () => ({
  useAuthRequest: () => [null, null, jest.fn()],
}));
jest.mock('expo-web-browser', () => ({ maybeCompleteAuthSession: jest.fn() }));

const mockAuth = authService as jest.Mocked<typeof authService>;

describe('LoginScreen', () => {
  it('renders email and password fields', () => {
    const { getByPlaceholderText } = render(<LoginScreen />);
    expect(getByPlaceholderText('you@example.com')).toBeTruthy();
    expect(getByPlaceholderText('••••••••')).toBeTruthy();
  });

  it('shows error when fields are empty', async () => {
    const { getAllByText, getByText } = render(<LoginScreen />);
    // "Đăng nhập" appears as both title and button — press the last one (button)
    const buttons = getAllByText('Đăng nhập');
    fireEvent.press(buttons[buttons.length - 1]);
    await waitFor(() => {
      expect(getByText('Vui lòng nhập đầy đủ thông tin')).toBeTruthy();
    });
  });

  it('shows error for invalid email format', async () => {
    const { getByPlaceholderText, getAllByText, getByText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'not-an-email');
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'password123');
    const buttons = getAllByText('Đăng nhập');
    fireEvent.press(buttons[buttons.length - 1]);
    await waitFor(() => {
      expect(getByText('Email không hợp lệ')).toBeTruthy();
    });
  });

  it('calls authService.login with credentials', async () => {
    mockAuth.login.mockResolvedValueOnce({
      accessToken: 'token',
      email: 'user@test.com',
      fullName: 'Test User',
      role: 'Customer',
    });
    const { getByPlaceholderText, getAllByText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'user@test.com');
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'password123');
    const buttons = getAllByText('Đăng nhập');
    fireEvent.press(buttons[buttons.length - 1]);
    await waitFor(() => {
      expect(mockAuth.login).toHaveBeenCalledWith('user@test.com', 'password123');
    });
  });

  it('shows error when login fails', async () => {
    mockAuth.login.mockRejectedValueOnce(new Error('Sai mật khẩu'));
    const { getByPlaceholderText, getAllByText, getByText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'user@test.com');
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'wrongpass');
    const buttons = getAllByText('Đăng nhập');
    fireEvent.press(buttons[buttons.length - 1]);
    await waitFor(() => {
      expect(getByText(/Sai mật khẩu/)).toBeTruthy();
    });
  });

  it('renders social login buttons', () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText('Tiếp tục với Google')).toBeTruthy();
    expect(getByText('Tiếp tục với Facebook')).toBeTruthy();
  });

  it('renders link to register screen', () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText('Đăng ký ngay')).toBeTruthy();
  });
});
