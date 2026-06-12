import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import CheckoutScreen from '@/app/checkout';
import { cartService } from '@/services/cart.service';
import { hubsService } from '@/services/hubs.service';
import { ordersService } from '@/services/orders.service';
import { walletService } from '@/services/wallet.service';
import { addressesService } from '@/services/addresses.service';

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
  minimumOrderAmount: 0,
  freeShippingThreshold: 200000,
  shippingFee: 15000,
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

  it('allows selecting bank transfer payment method', async () => {
    const { getByText } = render(<CheckoutScreen />, { wrapper });
    await waitFor(() => expect(getByText('Chuyển khoản')).toBeTruthy());
    fireEvent.press(getByText('Chuyển khoản'));
    expect(getByText('Chuyển khoản')).toBeTruthy();
  });

  it('allows selecting wallet payment method', async () => {
    const { getByText } = render(<CheckoutScreen />, { wrapper });
    await waitFor(() => expect(getByText('Ví TapHoa')).toBeTruthy());
    fireEvent.press(getByText('Ví TapHoa'));
    expect(getByText('Ví TapHoa')).toBeTruthy();
  });

  it('enters note text', async () => {
    const { getByPlaceholderText } = render(<CheckoutScreen />, { wrapper });
    await waitFor(() =>
      expect(getByPlaceholderText('VD: Để hàng trước cửa, bấm chuông...')).toBeTruthy()
    );
    fireEvent.changeText(
      getByPlaceholderText('VD: Để hàng trước cửa, bấm chuông...'),
      'Giao giờ hành chính'
    );
    expect(getByPlaceholderText('VD: Để hàng trước cửa, bấm chuông...').props.value).toBe(
      'Giao giờ hành chính'
    );
  });

  it('allows switching hub selection', async () => {
    const secondHub = { ...mockHub, id: 'h2', name: 'Hub Q3' };
    jest.mocked(hubsService.getActive).mockResolvedValueOnce([mockHub, secondHub]);
    const { getByText } = render(<CheckoutScreen />, { wrapper });
    await waitFor(() => expect(getByText('Hub Q3')).toBeTruthy());
    fireEvent.press(getByText('Hub Q3'));
    expect(getByText('Hub Q3')).toBeTruthy();
  });

  it('shows error when placing order without hub', async () => {
    jest.mocked(hubsService.getActive).mockResolvedValueOnce([]);
    const { getByText } = render(<CheckoutScreen />, { wrapper });
    await waitFor(() => expect(getByText(/Đặt hàng/)).toBeTruthy());
    fireEvent.press(getByText(/Đặt hàng/));
    await waitFor(() => {
      expect(getByText('Vui lòng chọn điểm nhận hàng')).toBeTruthy();
    });
  });

  it('enters and applies voucher code', async () => {
    const { vouchersService } = jest.requireMock('@/services/vouchers.service');
    vouchersService.validate.mockResolvedValueOnce({
      discount: 10000,
      message: 'Áp dụng thành công',
    });
    const { getByPlaceholderText, getByText } = render(<CheckoutScreen />, { wrapper });
    await waitFor(() => expect(getByPlaceholderText('Nhập mã giảm giá')).toBeTruthy());
    fireEvent.changeText(getByPlaceholderText('Nhập mã giảm giá'), 'SALE10');
    fireEvent.press(getByText('Áp dụng'));
    await waitFor(() => {
      expect(vouchersService.validate).toHaveBeenCalledWith('SALE10', expect.any(Number));
    });
  });
});
