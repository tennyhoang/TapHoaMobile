import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ProfileScreen from '@/app/(tabs)/profile';

jest.mock('@/services/profile.service', () => ({
  profileService: { deleteAccount: jest.fn() },
}));

const mockUseAuth = jest.fn();
jest.mock('@/lib/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

const customerUser = { fullName: 'Test User', email: 'test@example.com', role: 'Customer' };
const adminUser = { fullName: 'Admin', email: 'admin@example.com', role: 'Admin' };

const wrapper = ({ children }: any) => <SafeAreaProvider>{children}</SafeAreaProvider>;

describe('ProfileScreen', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: customerUser, logout: jest.fn() });
  });

  it('renders user name and email', () => {
    const { getByText } = render(<ProfileScreen />, { wrapper });
    expect(getByText('Test User')).toBeTruthy();
    expect(getByText('test@example.com')).toBeTruthy();
  });

  it('renders standard menu items', () => {
    const { getByText } = render(<ProfileScreen />, { wrapper });
    expect(getByText('Ví của tôi')).toBeTruthy();
    expect(getByText('Đơn hàng của tôi')).toBeTruthy();
    expect(getByText('Sản phẩm yêu thích')).toBeTruthy();
    expect(getByText('Thông báo')).toBeTruthy();
  });

  it('does not render admin button for Customer role', () => {
    const { queryByText } = render(<ProfileScreen />, { wrapper });
    expect(queryByText('Admin Dashboard')).toBeNull();
  });

  it('renders admin button for Admin role', () => {
    mockUseAuth.mockReturnValue({ user: adminUser, logout: jest.fn() });
    const { getByText } = render(<ProfileScreen />, { wrapper });
    expect(getByText('Admin Dashboard')).toBeTruthy();
  });

  it('renders logout button', () => {
    const { getByText } = render(<ProfileScreen />, { wrapper });
    expect(getByText('Đăng xuất')).toBeTruthy();
  });

  it('navigates to correct routes on menu press', () => {
    const { getByText } = render(<ProfileScreen />, { wrapper });
    const { router } = jest.requireMock('expo-router');
    fireEvent.press(getByText('Ví của tôi'));
    expect(router.push).toHaveBeenCalledWith('/wallet');
  });

  it('calls logout and navigates on logout button press', async () => {
    const mockLogout = jest.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({ user: customerUser, logout: mockLogout });
    const { getByText } = render(<ProfileScreen />, { wrapper });
    const { router } = jest.requireMock('expo-router');
    fireEvent.press(getByText('Đăng xuất'));
    await new Promise(r => setTimeout(r, 0));
    expect(mockLogout).toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith('/(auth)/login');
  });

  it('shows delete account confirmation dialog', () => {
    const { Alert } = require('react-native');
    Alert.alert = jest.fn();
    const { getByText } = render(<ProfileScreen />, { wrapper });
    fireEvent.press(getByText('Xoá tài khoản'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Xoá tài khoản',
      expect.any(String),
      expect.any(Array)
    );
  });

  it('executes delete account when confirmed', async () => {
    const { Alert } = require('react-native');
    const mockDeleteAccount = jest.fn().mockResolvedValue(undefined);
    const mockLogout = jest.fn().mockResolvedValue(undefined);
    const { profileService } = jest.requireMock('@/services/profile.service');
    profileService.deleteAccount = mockDeleteAccount;
    mockUseAuth.mockReturnValue({ user: customerUser, logout: mockLogout });
    Alert.alert = jest.fn((_title: any, _msg: any, buttons: any) => {
      const confirmBtn = buttons?.find((b: any) => b.style === 'destructive');
      confirmBtn?.onPress?.();
    });
    const { getByText } = render(<ProfileScreen />, { wrapper });
    fireEvent.press(getByText('Xoá tài khoản'));
    await new Promise(r => setTimeout(r, 0));
    expect(mockDeleteAccount).toHaveBeenCalled();
  });

  it('navigates to agent portal on button press', () => {
    mockUseAuth.mockReturnValue({ user: { ...customerUser, role: 'Agent' }, logout: jest.fn() });
    const { getByText } = render(<ProfileScreen />, { wrapper });
    const { router } = jest.requireMock('expo-router');
    fireEvent.press(getByText('Cổng Agent'));
    expect(router.push).toHaveBeenCalledWith('/agent');
  });

  it('navigates to driver portal on button press', () => {
    mockUseAuth.mockReturnValue({ user: { ...customerUser, role: 'Driver' }, logout: jest.fn() });
    const { getByText } = render(<ProfileScreen />, { wrapper });
    const { router } = jest.requireMock('expo-router');
    fireEvent.press(getByText('Cổng Tài xế'));
    expect(router.push).toHaveBeenCalledWith('/driver');
  });

  it('navigates to admin portal on button press', () => {
    mockUseAuth.mockReturnValue({ user: { ...customerUser, role: 'Admin' }, logout: jest.fn() });
    const { getByText } = render(<ProfileScreen />, { wrapper });
    const { router } = jest.requireMock('expo-router');
    fireEvent.press(getByText('Admin Dashboard'));
    expect(router.push).toHaveBeenCalledWith('/admin');
  });

  it('renders legal links', () => {
    const { getByText } = render(<ProfileScreen />, { wrapper });
    expect(getByText('Chính sách bảo mật')).toBeTruthy();
    expect(getByText('Điều khoản sử dụng')).toBeTruthy();
  });
});
