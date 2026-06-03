import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ProfileEditScreen from '@/app/profile-edit';
import { profileService } from '@/services/profile.service';

const mockUseAuth = jest.fn();
jest.mock('@/lib/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('@/services/profile.service', () => ({
  profileService: { getMe: jest.fn(), update: jest.fn(), changePassword: jest.fn() },
}));

jest.mock('@/lib/biometrics', () => ({
  biometrics: { authenticate: jest.fn() },
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('expo-image', () => ({
  Image: () => null,
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

const mockShowToast = jest.fn();
jest.mock('@/components/Toast', () => ({
  useToast: () => ({ show: mockShowToast }),
}));

const mockProfile = jest.mocked(profileService);
const mockUpdateUser = jest.fn();
const wrapper = ({ children }: any) => <SafeAreaProvider>{children}</SafeAreaProvider>;

const defaultUser = {
  email: 'test@example.com',
  fullName: 'Test User',
  role: 'Customer',
  phoneNumber: '0123456789',
};

describe('ProfileEditScreen', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: defaultUser, updateUser: mockUpdateUser });
    mockProfile.getMe.mockResolvedValue({
      id: 'u1',
      email: 'test@example.com',
      fullName: 'Test User',
      phoneNumber: '0123456789',
      avatarUrl: null,
      isActive: true,
    });
    mockProfile.update.mockRejectedValue(new Error('no update'));
    mockProfile.changePassword.mockRejectedValue(new Error('no pw change'));
    (jest.requireMock('@/lib/biometrics') as any).biometrics.authenticate.mockResolvedValue(true);
  });

  it('loads user data from profile service on mount', async () => {
    mockProfile.getMe.mockResolvedValueOnce({
      id: 'u1',
      email: 'test@example.com',
      fullName: 'Nguyen Van A',
      phoneNumber: '0987654321',
      avatarUrl: null,
      isActive: true,
    });
    const { getByDisplayValue } = render(<ProfileEditScreen />, { wrapper });
    await waitFor(() => {
      expect(getByDisplayValue('Nguyen Van A')).toBeTruthy();
    });
  });

  it('renders form fields', async () => {
    const { getByPlaceholderText, getByText } = render(<ProfileEditScreen />, { wrapper });
    await waitFor(() => expect(getByPlaceholderText('Nhập họ và tên')).toBeTruthy());
    expect(getByPlaceholderText('Nhập số điện thoại')).toBeTruthy();
    expect(getByText('Lưu thay đổi')).toBeTruthy();
    expect(getByText('Chỉnh sửa hồ sơ')).toBeTruthy();
  });

  it('shows validation error when name is empty', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<ProfileEditScreen />, {
      wrapper,
    });
    fireEvent.changeText(getByPlaceholderText('Nhập họ và tên'), '');
    fireEvent.press(getByText('Lưu thay đổi'));
    expect(await findByText('Tên không được để trống')).toBeTruthy();
  });

  it('saves profile changes successfully', async () => {
    mockProfile.update.mockResolvedValueOnce({
      id: 'u1',
      email: 'test@example.com',
      fullName: 'Updated Name',
      phoneNumber: '0987654321',
      avatarUrl: null,
      isActive: true,
    });
    const { getByPlaceholderText, getByText } = render(<ProfileEditScreen />, { wrapper });
    fireEvent.changeText(getByPlaceholderText('Nhập họ và tên'), 'Updated Name');
    fireEvent.changeText(getByPlaceholderText('Nhập số điện thoại'), '0987654321');
    fireEvent.press(getByText('Lưu thay đổi'));
    await waitFor(() => {
      expect(mockProfile.update).toHaveBeenCalledWith({
        fullName: 'Updated Name',
        phoneNumber: '0987654321',
      });
    });
    expect(mockUpdateUser).toHaveBeenCalledWith({
      fullName: 'Updated Name',
      phoneNumber: '0987654321',
    });
    const { router } = jest.requireMock('expo-router');
    expect(router.back).toHaveBeenCalled();
  });

  it('shows error toast when save fails', async () => {
    mockProfile.update.mockRejectedValueOnce(new Error('Server error'));
    const { getByText } = render(<ProfileEditScreen />, { wrapper });
    fireEvent.press(getByText('Lưu thay đổi'));
    await waitFor(() => {
      expect(mockProfile.update).toHaveBeenCalled();
    });
    expect(mockShowToast).toHaveBeenCalledWith('Server error', 'error');
  });

  it('toggles password section', async () => {
    const { getByText, queryAllByPlaceholderText } = render(<ProfileEditScreen />, { wrapper });
    await waitFor(() => expect(mockProfile.getMe).toHaveBeenCalled());
    expect(queryAllByPlaceholderText('••••••••')).toHaveLength(0);
    fireEvent.press(getByText('Đổi mật khẩu'));
    expect(queryAllByPlaceholderText('••••••••').length).toBeGreaterThan(0);
  });

  it('shows password validation error for empty fields', async () => {
    const { getByText, findByText } = render(<ProfileEditScreen />, { wrapper });
    fireEvent.press(getByText('Đổi mật khẩu'));
    fireEvent.press(getByText('Xác nhận đổi mật khẩu'));
    expect(await findByText('Vui lòng điền đầy đủ thông tin')).toBeTruthy();
  });

  it('shows password validation error for short new password', async () => {
    const { getByPlaceholderText, getAllByPlaceholderText, getByText, findByText } = render(
      <ProfileEditScreen />,
      { wrapper }
    );
    fireEvent.press(getByText('Đổi mật khẩu'));
    fireEvent.changeText(getAllByPlaceholderText('••••••••')[0], 'oldpw');
    fireEvent.changeText(getByPlaceholderText('Ít nhất 6 ký tự'), '12345');
    fireEvent.changeText(getAllByPlaceholderText('••••••••')[1], '12345');
    fireEvent.press(getByText('Xác nhận đổi mật khẩu'));
    expect(await findByText('Mật khẩu mới phải có ít nhất 6 ký tự')).toBeTruthy();
  });

  it('shows password validation error for mismatched passwords', async () => {
    const { getByPlaceholderText, getAllByPlaceholderText, getByText, findByText } = render(
      <ProfileEditScreen />,
      { wrapper }
    );
    fireEvent.press(getByText('Đổi mật khẩu'));
    fireEvent.changeText(getAllByPlaceholderText('••••••••')[0], 'oldpw');
    fireEvent.changeText(getByPlaceholderText('Ít nhất 6 ký tự'), 'newpassword');
    fireEvent.changeText(getAllByPlaceholderText('••••••••')[1], 'different');
    fireEvent.press(getByText('Xác nhận đổi mật khẩu'));
    expect(await findByText('Xác nhận mật khẩu không khớp')).toBeTruthy();
  });

  it('changes password successfully', async () => {
    mockProfile.changePassword.mockResolvedValueOnce(undefined);
    const { getByPlaceholderText, getAllByPlaceholderText, getByText } = render(
      <ProfileEditScreen />,
      { wrapper }
    );
    fireEvent.press(getByText('Đổi mật khẩu'));
    fireEvent.changeText(getAllByPlaceholderText('••••••••')[0], 'currentpw');
    fireEvent.changeText(getByPlaceholderText('Ít nhất 6 ký tự'), 'newpassword');
    fireEvent.changeText(getAllByPlaceholderText('••••••••')[1], 'newpassword');
    fireEvent.press(getByText('Xác nhận đổi mật khẩu'));
    await waitFor(() => {
      expect(mockProfile.changePassword).toHaveBeenCalledWith({
        currentPassword: 'currentpw',
        newPassword: 'newpassword',
      });
    });
  });
});
