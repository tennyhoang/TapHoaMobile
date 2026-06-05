import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RegisterScreen from '@/app/(auth)/register';
import { authService } from '@/services/auth.service';
import { router } from 'expo-router';

jest.mock('@/services/auth.service', () => ({
  authService: { register: jest.fn(), socialLogin: jest.fn() },
}));
jest.mock('@/lib/auth-context', () => {
  const login = jest.fn();
  return {
    useAuth: () => ({ login }),
    __loginMock: login,
  };
});
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name }: any) => React.createElement(Text, null, name),
  };
});
jest.mock('expo-auth-session/providers/google', () => ({
  useAuthRequest: () => [null, null, jest.fn()],
}));
jest.mock('expo-web-browser', () => ({ maybeCompleteAuthSession: jest.fn() }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 }),
}));

const mockAuth = authService as jest.Mocked<typeof authService>;
jest.setTimeout(30000);

describe('RegisterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form with all fields', () => {
    const { getByPlaceholderText } = render(<RegisterScreen />);
    expect(getByPlaceholderText('Nguyễn Văn A')).toBeTruthy();
    expect(getByPlaceholderText('you@example.com')).toBeTruthy();
    expect(getByPlaceholderText('0912 345 678')).toBeTruthy();
    expect(getByPlaceholderText('Tối thiểu 8 ký tự, có chữ và số')).toBeTruthy();
    expect(getByPlaceholderText('Nhập lại mật khẩu')).toBeTruthy();
  });

  it('shows error when submitting with empty fields', async () => {
    const { getByText, getAllByText } = render(<RegisterScreen />);
    const buttons = getAllByText('Tạo tài khoản');
    fireEvent.press(buttons[buttons.length - 1]);
    await waitFor(() => {
      expect(getByText('Vui lòng nhập đầy đủ thông tin')).toBeTruthy();
    });
  });

  it('shows error for invalid email format', async () => {
    const { getByPlaceholderText, getAllByText, getByText } = render(<RegisterScreen />);
    fireEvent.changeText(getByPlaceholderText('Nguyễn Văn A'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'not-an-email');
    fireEvent.changeText(
      getByPlaceholderText('Tối thiểu 8 ký tự, có chữ và số'),
      'SomePassword123'
    );
    const buttons = getAllByText('Tạo tài khoản');
    fireEvent.press(buttons[buttons.length - 1]);
    await waitFor(() => {
      expect(getByText('Email không hợp lệ')).toBeTruthy();
    });
  });

  it('shows error for short password (< 8 chars)', async () => {
    const { getByPlaceholderText, getAllByText, getByText } = render(<RegisterScreen />);
    fireEvent.changeText(getByPlaceholderText('Nguyễn Văn A'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Tối thiểu 8 ký tự, có chữ và số'), 'short');
    const buttons = getAllByText('Tạo tài khoản');
    fireEvent.press(buttons[buttons.length - 1]);
    await waitFor(() => {
      expect(getByText('Mật khẩu tối thiểu 8 ký tự, có cả chữ lẫn số')).toBeTruthy();
    });
  });

  it('shows error when passwords do not match', async () => {
    const { getByPlaceholderText, getAllByText, getByText } = render(<RegisterScreen />);
    fireEvent.changeText(getByPlaceholderText('Nguyễn Văn A'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Tối thiểu 8 ký tự, có chữ và số'), 'Password123');
    fireEvent.changeText(getByPlaceholderText('Nhập lại mật khẩu'), 'Password456');
    const buttons = getAllByText('Tạo tài khoản');
    fireEvent.press(buttons[buttons.length - 1]);
    await waitFor(() => {
      expect(getByText('Mật khẩu xác nhận không khớp')).toBeTruthy();
    });
  });

  it('shows error when terms not agreed', async () => {
    const { getByPlaceholderText, getAllByText, getByText } = render(<RegisterScreen />);
    fireEvent.changeText(getByPlaceholderText('Nguyễn Văn A'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Tối thiểu 8 ký tự, có chữ và số'), 'Password123');
    fireEvent.changeText(getByPlaceholderText('Nhập lại mật khẩu'), 'Password123');
    const buttons = getAllByText('Tạo tài khoản');
    fireEvent.press(buttons[buttons.length - 1]);
    await waitFor(() => {
      expect(getByText('Vui lòng đồng ý với Điều khoản sử dụng')).toBeTruthy();
    });
  });

  it('toggle password visibility works', () => {
    const { getByPlaceholderText, getAllByText } = render(<RegisterScreen />);
    const passwordInput = getByPlaceholderText('Tối thiểu 8 ký tự, có chữ và số');
    expect(passwordInput.props.secureTextEntry).toBe(true);

    const eyeIcons = getAllByText('eye-outline');
    fireEvent.press(eyeIcons[0]);

    const updatedInput = getByPlaceholderText('Tối thiểu 8 ký tự, có chữ và số');
    expect(updatedInput.props.secureTextEntry).toBe(false);
  });

  it('toggle confirm password visibility works', () => {
    const { getByPlaceholderText, getAllByText } = render(<RegisterScreen />);
    const confirmInput = getByPlaceholderText('Nhập lại mật khẩu');
    expect(confirmInput.props.secureTextEntry).toBe(true);

    const eyeIcons = getAllByText('eye-outline');
    fireEvent.press(eyeIcons[1]);

    const updatedInput = getByPlaceholderText('Nhập lại mật khẩu');
    expect(updatedInput.props.secureTextEntry).toBe(false);
  });

  it('successful registration calls authService.register and login, then navigates', async () => {
    mockAuth.register.mockResolvedValueOnce({
      accessToken: 'test-token',
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'Customer',
    });

    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);
    fireEvent.changeText(getByPlaceholderText('Nguyễn Văn A'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Tối thiểu 8 ký tự, có chữ và số'), 'Password123');
    fireEvent.changeText(getByPlaceholderText('Nhập lại mật khẩu'), 'Password123');

    // Toggle terms checkbox by pressing its parent TouchableOpacity
    const termsLink = getByText('Điều khoản sử dụng');
    const tosRow = termsLink.parent!.parent!;
    fireEvent.press(tosRow);

    fireEvent.press(getByText('Tạo tài khoản'));

    await waitFor(() => {
      expect(mockAuth.register).toHaveBeenCalledWith(
        'Test User',
        'test@example.com',
        'Password123',
        undefined
      );
    });

    const { __loginMock } = jest.requireMock('@/lib/auth-context');
    await waitFor(() => {
      expect(__loginMock).toHaveBeenCalledWith(
        'test-token',
        'test@example.com',
        'Test User',
        'Customer'
      );
    });

    expect(router.replace).toHaveBeenCalledWith('/(tabs)');
  });

  it('API error displays error message', async () => {
    mockAuth.register.mockRejectedValueOnce(new Error('Email đã tồn tại'));

    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);
    fireEvent.changeText(getByPlaceholderText('Nguyễn Văn A'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Tối thiểu 8 ký tự, có chữ và số'), 'Password123');
    fireEvent.changeText(getByPlaceholderText('Nhập lại mật khẩu'), 'Password123');

    const termsLink = getByText('Điều khoản sử dụng');
    const tosRow = termsLink.parent!.parent!;
    fireEvent.press(tosRow);
    fireEvent.press(getByText('Tạo tài khoản'));

    await waitFor(() => {
      expect(getByText('Email đã tồn tại')).toBeTruthy();
    });
  });

  it('shows loading indicator while registering', async () => {
    mockAuth.register.mockImplementation(() => new Promise<never>(() => {}));

    const { getByPlaceholderText, getByText, queryAllByText } = render(<RegisterScreen />);
    fireEvent.changeText(getByPlaceholderText('Nguyễn Văn A'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Tối thiểu 8 ký tự, có chữ và số'), 'Password123');
    fireEvent.changeText(getByPlaceholderText('Nhập lại mật khẩu'), 'Password123');

    const termsLink = getByText('Điều khoản sử dụng');
    const tosRow = termsLink.parent!.parent!;
    fireEvent.press(tosRow);
    fireEvent.press(getByText('Tạo tài khoản'));

    await waitFor(() => {
      const texts = queryAllByText('Tạo tài khoản');
      expect(texts).toHaveLength(0);
    });
  });

  it('Google social login button is present', () => {
    const { getByText } = render(<RegisterScreen />);
    expect(getByText('Tiếp tục với Google')).toBeTruthy();
  });

  it('"Đã có tài khoản? Đăng nhập" link navigates back', () => {
    const { getByText } = render(<RegisterScreen />);
    const loginLink = getByText('Đăng nhập');
    fireEvent.press(loginLink.parent!);
    expect(router.back).toHaveBeenCalled();
  });

  it('Terms link navigates to /terms', () => {
    const { getByText } = render(<RegisterScreen />);
    fireEvent.press(getByText('Điều khoản sử dụng'));
    expect(router.push).toHaveBeenCalledWith('/terms');
  });
});
