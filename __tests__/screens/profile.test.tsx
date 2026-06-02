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
});
