import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AddressesScreen from '@/app/addresses/page';
import { addressesService } from '@/services/addresses.service';

jest.mock('@/services/addresses.service', () => ({
  addressesService: { getAll: jest.fn(), add: jest.fn(), delete: jest.fn(), setDefault: jest.fn() },
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useFocusEffect: (cb: any) => cb(),
}));

jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual('react-native');
  return { Ionicons: (props: any) => <Text>{props.name}</Text> };
});

jest.mock('@/components/EmptyState', () => {
  const { View, Text, TouchableOpacity } = jest.requireActual('react-native');
  const Mock = ({ title, action }: any) => (
    <View>
      <Text>{title}</Text>
      {action && (
        <TouchableOpacity onPress={action.onPress}>
          <Text>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
  Mock.displayName = 'EmptyState';
  return Mock;
});

const mockService = jest.mocked(addressesService);
const wrapper = ({ children }: any) => <SafeAreaProvider>{children}</SafeAreaProvider>;

const defaultAddr = {
  id: 'a1',
  receiverName: 'Nguyễn Văn A',
  phoneNumber: '0912 345 678',
  province: 'TP. Hồ Chí Minh',
  district: 'Quận 1',
  ward: 'Phường Bến Nghé',
  streetAddress: '123 Nguyễn Huệ',
  isDefault: true,
};

const normalAddr = {
  id: 'a2',
  receiverName: 'Trần Thị B',
  phoneNumber: '0987 654 321',
  province: 'Hà Nội',
  district: 'Hoàn Kiếm',
  ward: 'Phường Hàng Bài',
  streetAddress: '45 Lê Thái Tổ',
  isDefault: false,
};

describe('AddressesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockService.getAll.mockReturnValue(new Promise(() => {}));
    render(<AddressesScreen />, { wrapper });
    expect(mockService.getAll).toHaveBeenCalled();
  });

  it('renders empty state when no addresses', async () => {
    mockService.getAll.mockResolvedValueOnce([]);
    const { getByText } = render(<AddressesScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Chưa có địa chỉ nào')).toBeTruthy();
    });
  });

  it('renders address list when data loaded', async () => {
    mockService.getAll.mockResolvedValueOnce([defaultAddr, normalAddr]);
    const { getByText } = render(<AddressesScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Nguyễn Văn A')).toBeTruthy();
      expect(getByText('0912 345 678')).toBeTruthy();
      expect(getByText('Trần Thị B')).toBeTruthy();
      expect(getByText('0987 654 321')).toBeTruthy();
    });
  });

  it('shows Mặc định badge for default address', async () => {
    mockService.getAll.mockResolvedValueOnce([defaultAddr]);
    const { getByText } = render(<AddressesScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Mặc định')).toBeTruthy();
    });
  });

  it('shows Đặt mặc định button for non-default address', async () => {
    mockService.getAll.mockResolvedValueOnce([normalAddr]);
    const { getByText } = render(<AddressesScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Đặt mặc định')).toBeTruthy();
    });
  });

  it('calls setDefault when Đặt mặc định is pressed', async () => {
    mockService.getAll.mockResolvedValueOnce([normalAddr]);
    mockService.setDefault.mockResolvedValueOnce(undefined);
    const { getByText } = render(<AddressesScreen />, { wrapper });
    await waitFor(() => getByText('Đặt mặc định'));
    fireEvent.press(getByText('Đặt mặc định'));
    await waitFor(() => {
      expect(mockService.setDefault).toHaveBeenCalledWith('a2');
    });
  });

  it('opens modal on add button press from header', async () => {
    mockService.getAll.mockResolvedValueOnce([normalAddr]);
    const { getByText } = render(<AddressesScreen />, { wrapper });
    await waitFor(() => getByText('Trần Thị B'));
    fireEvent.press(getByText('add'));
    expect(getByText('Thêm địa chỉ mới')).toBeTruthy();
  });

  it('form validation shows error on empty save', async () => {
    mockService.getAll.mockResolvedValueOnce([]);
    const { getByText } = render(<AddressesScreen />, { wrapper });
    await waitFor(() => getByText('Chưa có địa chỉ nào'));
    fireEvent.press(getByText('Thêm địa chỉ'));
    await waitFor(() => getByText('Thêm địa chỉ mới'));
    fireEvent.press(getByText('Lưu địa chỉ'));
    expect(getByText('Vui lòng nhập đầy đủ thông tin')).toBeTruthy();
  });

  it('closing modal works', async () => {
    mockService.getAll.mockResolvedValueOnce([]);
    const { getByText, queryByText } = render(<AddressesScreen />, { wrapper });
    await waitFor(() => getByText('Chưa có địa chỉ nào'));
    fireEvent.press(getByText('Thêm địa chỉ'));
    await waitFor(() => getByText('Thêm địa chỉ mới'));
    fireEvent.press(getByText('close'));
    expect(queryByText('Thêm địa chỉ mới')).toBeNull();
  });

  it('delete button triggers Alert', async () => {
    mockService.getAll.mockResolvedValueOnce([normalAddr]);
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByText } = render(<AddressesScreen />, { wrapper });
    await waitFor(() => getByText('Xoá'));
    fireEvent.press(getByText('Xoá'));
    expect(alertSpy).toHaveBeenCalledWith(
      'Xoá địa chỉ',
      'Bạn có chắc muốn xoá địa chỉ này?',
      expect.any(Array)
    );
    alertSpy.mockRestore();
  });
});
