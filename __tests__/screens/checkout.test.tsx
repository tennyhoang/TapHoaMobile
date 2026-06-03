import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import CheckoutScreen from '@/app/checkout/page';
import { cartService } from '@/services/cart.service';
import { hubsService } from '@/services/hubs.service';
import { ordersService } from '@/services/orders.service';
import { walletService } from '@/services/wallet.service';
import { addressesService } from '@/services/addresses.service';
import { vouchersService } from '@/services/vouchers.service';

jest.mock('@/services/cart.service', () => ({
  cartService: { get: jest.fn() },
}));
jest.mock('@/services/hubs.service', () => ({
  hubsService: { getActive: jest.fn() },
}));
jest.mock('@/services/orders.service', () => ({
  ordersService: { create: jest.fn() },
}));
jest.mock('@/services/wallet.service', () => ({
  walletService: { getBalance: jest.fn() },
}));
jest.mock('@/services/addresses.service', () => ({
  addressesService: { getAll: jest.fn() },
}));
jest.mock('@/services/vouchers.service', () => ({
  vouchersService: { validate: jest.fn() },
}));
jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn() },
}));
jest.mock('@/lib/biometrics', () => ({
  biometrics: { authenticate: jest.fn().mockResolvedValue(true) },
}));
jest.mock('react-native-maps', () => {
  const { View } = jest.requireActual('react-native');
  const MapView = ({ children }: any) => <View testID="map-view">{children}</View>;
  MapView.displayName = 'MapView';
  return {
    __esModule: true,
    default: MapView,
    Marker: ({ children }: any) => <View>{children}</View>,
    PROVIDER_GOOGLE: 'google',
  };
});
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'denied' }),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));
jest.mock('@/components/ScreenHeader', () => {
  const { View, Text } = jest.requireActual('react-native');
  const Mock = ({ title }: { title: string }) => (
    <View>
      <Text>{title}</Text>
    </View>
  );
  Mock.displayName = 'ScreenHeader';
  return Mock;
});

const wrapper = ({ children }: any) => <SafeAreaProvider>{children}</SafeAreaProvider>;

const mockHub = {
  id: 'h1',
  name: 'Hub Q1',
  address: '123 Nguyễn Văn A',
  ward: 'Bến Nghé',
  district: 'Quận 1',
  city: 'TP.HCM',
  latitude: 10.77,
  longitude: 106.69,
};

const mockCartData = {
  items: [
    { productId: 'p1', productName: 'Gạo ST25', quantity: 2, unitPrice: 50000, subtotal: 100000 },
  ],
  totalAmount: 100000,
  totalItems: 2,
};

const mockAddress = {
  id: 'a1',
  receiverName: 'Nguyễn Văn A',
  phoneNumber: '0901234567',
  streetAddress: '10 Lê Lợi',
  ward: 'Bến Nghé',
  district: 'Quận 1',
  province: 'TP.HCM',
  isDefault: true,
};

function setupMocks() {
  jest.mocked(cartService.get).mockResolvedValue(mockCartData);
  jest.mocked(hubsService.getActive).mockResolvedValue([mockHub]);
  jest.mocked(walletService.getBalance).mockResolvedValue({ balance: 50000 } as any);
  jest.mocked(addressesService.getAll).mockResolvedValue([mockAddress]);
}

describe('CheckoutScreen', () => {
  beforeEach(() => {
    setupMocks();
  });

  it('shows loading indicator initially', () => {
    jest.mocked(cartService.get).mockReturnValue(new Promise(() => {}));
    const { toJSON } = render(<CheckoutScreen />, { wrapper });
    expect(toJSON()).not.toBeNull();
  });

  it('renders screen header after loading', async () => {
    const { getByText } = render(<CheckoutScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Xác nhận đơn hàng')).toBeTruthy();
    });
  });

  it('renders cart items section after loading', async () => {
    const { getByText } = render(<CheckoutScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Gạo ST25')).toBeTruthy();
    });
  });

  it('renders hub selection section', async () => {
    const { getByText } = render(<CheckoutScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Hub Q1')).toBeTruthy();
    });
  });

  it('renders payment method options', async () => {
    const { getByText } = render(<CheckoutScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Tiền mặt (COD)')).toBeTruthy();
      expect(getByText('Chuyển khoản')).toBeTruthy();
      expect(getByText('Ví TapHoa')).toBeTruthy();
    });
  });

  it('renders place order button with amount', async () => {
    const { getByText } = render(<CheckoutScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText(/Đặt hàng/)).toBeTruthy();
    });
  });

  it('calls ordersService.create on place order', async () => {
    jest.mocked(ordersService.create).mockResolvedValueOnce({ id: 'order-1' } as any);
    const { getByText } = render(<CheckoutScreen />, { wrapper });
    await waitFor(() => getByText(/Đặt hàng/));
    await act(async () => {
      fireEvent.press(getByText(/Đặt hàng/));
    });
    expect(ordersService.create).toHaveBeenCalledWith(
      expect.objectContaining({ hubId: 'h1', paymentMethod: 'COD' })
    );
  });

  it('shows error when place order fails', async () => {
    jest.mocked(ordersService.create).mockRejectedValueOnce(new Error('Đặt hàng thất bại'));
    const { getByText } = render(<CheckoutScreen />, { wrapper });
    await waitFor(() => getByText(/Đặt hàng/));
    await act(async () => {
      fireEvent.press(getByText(/Đặt hàng/));
    });
    await waitFor(() => {
      expect(getByText('Đặt hàng thất bại')).toBeTruthy();
    });
  });

  it('shows no-hub message when hub list is empty', async () => {
    jest.mocked(hubsService.getActive).mockResolvedValueOnce([]);
    const { getByText } = render(<CheckoutScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Không có Hub nào đang hoạt động')).toBeTruthy();
    });
  });

  it('shows add address button when no address is available', async () => {
    jest.mocked(addressesService.getAll).mockResolvedValueOnce([]);
    const { getByText } = render(<CheckoutScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Thêm địa chỉ người nhận')).toBeTruthy();
    });
  });

  it('shows error when place order without hub selected', async () => {
    jest.mocked(hubsService.getActive).mockResolvedValueOnce([]);
    const { getByText, findByText } = render(<CheckoutScreen />, { wrapper });
    await waitFor(() => getByText('Xác nhận đơn hàng'));
    const placeBtn = getByText(/Đặt hàng/);
    await act(async () => {
      fireEvent.press(placeBtn);
    });
    expect(await findByText('Vui lòng chọn điểm nhận hàng')).toBeTruthy();
  });

  it('applies voucher successfully', async () => {
    jest
      .mocked(vouchersService.validate)
      .mockResolvedValueOnce({ label: 'Giảm 10%', discount: 10000 } as any);
    const { getByText, getByPlaceholderText } = render(<CheckoutScreen />, { wrapper });
    await waitFor(() => getByText('Xác nhận đơn hàng'));
    const input = getByPlaceholderText('Nhập mã voucher...');
    fireEvent.changeText(input, 'SALE10');
    fireEvent.press(getByText('Áp dụng'));
    await waitFor(() => {
      expect(getByText('Giảm 10%')).toBeTruthy();
    });
  });

  it('shows error when voucher is invalid', async () => {
    jest.mocked(vouchersService.validate).mockRejectedValueOnce(new Error('Invalid'));
    const { getByText, getByPlaceholderText } = render(<CheckoutScreen />, { wrapper });
    await waitFor(() => getByText('Xác nhận đơn hàng'));
    const input = getByPlaceholderText('Nhập mã voucher...');
    fireEvent.changeText(input, 'INVALID');
    fireEvent.press(getByText('Áp dụng'));
    await waitFor(() => {
      expect(getByText('Mã voucher không hợp lệ hoặc đã hết hạn')).toBeTruthy();
    });
  });

  it('switches payment method to Wallet and shows balance', async () => {
    jest.mocked(walletService.getBalance).mockResolvedValueOnce({ balance: 200000 } as any);
    const { getByText } = render(<CheckoutScreen />, { wrapper });
    await waitFor(() => getByText('Xác nhận đơn hàng'));
    fireEvent.press(getByText('Ví TapHoa'));
    await waitFor(() => {
      expect(getByText(/200.000/)).toBeTruthy();
    });
  });

  it('cancels order when biometric auth fails', async () => {
    const { biometrics } = jest.requireMock('@/lib/biometrics');
    biometrics.authenticate.mockResolvedValueOnce(false);
    jest.mocked(ordersService.create).mockResolvedValueOnce({ id: 'order-1' } as any);
    const { getByText } = render(<CheckoutScreen />, { wrapper });
    await waitFor(() => getByText(/Đặt hàng/));
    await act(async () => {
      fireEvent.press(getByText(/Đặt hàng/));
    });
    expect(ordersService.create).not.toHaveBeenCalled();
  });

  it('shows discount row when voucher is applied', async () => {
    jest
      .mocked(vouchersService.validate)
      .mockResolvedValueOnce({ label: 'Giảm 20K', discount: 20000 } as any);
    const { getByText, getByPlaceholderText } = render(<CheckoutScreen />, { wrapper });
    await waitFor(() => getByText('Xác nhận đơn hàng'));
    const input = getByPlaceholderText('Nhập mã voucher...');
    fireEvent.changeText(input, 'SALE20');
    fireEvent.press(getByText('Áp dụng'));
    await waitFor(() => {
      expect(getByText('Voucher')).toBeTruthy();
    });
  });

  it('navigates back when initial data fetch fails', async () => {
    jest.mocked(cartService.get).mockRejectedValueOnce(new Error('fail'));
    const { router } = jest.requireMock('expo-router');
    render(<CheckoutScreen />, { wrapper });
    await waitFor(() => {
      expect(router.back).toHaveBeenCalled();
    });
  });
});
