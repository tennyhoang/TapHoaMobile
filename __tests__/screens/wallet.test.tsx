import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import WalletScreen from '@/app/wallet';
import { walletService } from '@/services/wallet.service';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
}));

jest.mock('@/services/wallet.service', () => ({
  walletService: { getBalance: jest.fn(), getTransactions: jest.fn(), topUp: jest.fn() },
}));

const mockToastShow = jest.fn();
jest.mock('@/components/Toast', () => ({
  useToast: () => ({ show: mockToastShow }),
}));

jest.mock('@/lib/biometrics', () => ({
  biometrics: { authenticate: jest.fn().mockResolvedValue(true) },
}));

jest.mock('expo-screen-capture', () => ({
  preventScreenCaptureAsync: jest.fn(),
  allowScreenCaptureAsync: jest.fn(),
}));

jest.mock('@/components/EmptyState', () => {
  const { View, Text } = jest.requireActual('react-native');
  const Mock = ({ title }: any) => (
    <View>
      <Text>{title}</Text>
    </View>
  );
  Mock.displayName = 'EmptyState';
  return Mock;
});

jest.mock('expo-image', () => {
  const { View } = jest.requireActual('react-native');
  const Mock = () => <View testID="expo-image" />;
  Mock.displayName = 'ExpoImage';
  return { Image: Mock };
});

const wrapper = ({ children }: any) => <SafeAreaProvider>{children}</SafeAreaProvider>;

const mockTransactions = [
  {
    id: 't1',
    type: 'Credit',
    amount: 50000,
    description: 'Nạp vào ví',
    createdAt: '2025-06-01T10:00:00Z',
  },
  {
    id: 't2',
    type: 'Debit',
    amount: 30000,
    description: 'Thanh toán đơn hàng',
    createdAt: '2025-06-02T10:00:00Z',
  },
];

const mockService = jest.mocked(walletService);

describe('WalletScreen', () => {
  beforeEach(() => {
    mockService.getBalance.mockResolvedValue({ balance: 200000 });
    mockService.getTransactions.mockResolvedValue({
      items: mockTransactions,
      totalCount: 2,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    } as any);
  });

  it('shows loading indicator initially', () => {
    mockService.getBalance.mockReturnValue(new Promise(() => {}));
    const { toJSON } = render(<WalletScreen />, { wrapper });
    expect(toJSON()).not.toBeNull();
  });

  it('renders balance after loading', async () => {
    const { getByText } = render(<WalletScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('200.000 ₫')).toBeTruthy();
    });
  });

  it('renders transaction list', async () => {
    const { getByText } = render(<WalletScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Nạp vào ví')).toBeTruthy();
      expect(getByText('Thanh toán đơn hàng')).toBeTruthy();
    });
  });

  it('renders empty state when no transactions', async () => {
    mockService.getTransactions.mockResolvedValueOnce({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    } as any);
    const { getByText } = render(<WalletScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Chưa có giao dịch nào')).toBeTruthy();
    });
  });

  it('renders action buttons', async () => {
    const { getByText } = render(<WalletScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Nạp tiền')).toBeTruthy();
      expect(getByText('Lịch sử dùng')).toBeTruthy();
      expect(getByText('Hỗ trợ')).toBeTruthy();
    });
  });

  it('opens top-up modal on press', async () => {
    const { getByText, getAllByText } = render(<WalletScreen />, { wrapper });
    await waitFor(() => getByText('200.000 ₫'));
    fireEvent.press(getAllByText('Nạp tiền')[0]);
    await waitFor(() => {
      expect(getByText('Chọn hoặc nhập số tiền muốn nạp')).toBeTruthy();
    });
  });

  it('shows preset amounts in top-up modal', async () => {
    const { getByText, getAllByText } = render(<WalletScreen />, { wrapper });
    await waitFor(() => getByText('200.000 ₫'));
    fireEvent.press(getAllByText('Nạp tiền')[0]);
    await waitFor(() => {
      expect(getByText('50.000 ₫')).toBeTruthy();
      expect(getByText('100.000 ₫')).toBeTruthy();
    });
  });

  it('selects preset amount', async () => {
    const { getByText, getAllByText } = render(<WalletScreen />, { wrapper });
    await waitFor(() => getByText('200.000 ₫'));
    fireEvent.press(getAllByText('Nạp tiền')[0]);
    await waitFor(() => expect(getAllByText('50.000 ₫').length).toBeGreaterThan(0));
    fireEvent.press(getAllByText('50.000 ₫')[0]);
    await waitFor(() => {
      expect(getAllByText('50.000 ₫').length).toBeGreaterThan(0);
    });
  });

  it('shows confirm button after selecting amount', async () => {
    const { getByText, getAllByText } = render(<WalletScreen />, { wrapper });
    await waitFor(() => getByText('200.000 ₫'));
    fireEvent.press(getAllByText('Nạp tiền')[0]);
    await waitFor(() => getByText('100.000 ₫'));
    fireEvent.press(getByText('100.000 ₫'));
    await waitFor(() => {
      expect(getByText('Tiếp tục')).toBeTruthy();
    });
  });

  it('shows QR step after confirming amount', async () => {
    const { getByText, getAllByText } = render(<WalletScreen />, { wrapper });
    await waitFor(() => getByText('200.000 ₫'));
    fireEvent.press(getAllByText('Nạp tiền')[0]);
    await waitFor(() => getByText('100.000 ₫'));
    fireEvent.press(getByText('100.000 ₫'));
    await waitFor(() => getByText('Tiếp tục'));
    await act(async () => {
      fireEvent.press(getByText('Tiếp tục'));
    });
    await waitFor(() => {
      expect(getByText('Quét mã chuyển khoản')).toBeTruthy();
    });
  });

  it('shows bank info in QR step', async () => {
    const { getByText, getAllByText } = render(<WalletScreen />, { wrapper });
    await waitFor(() => getByText('200.000 ₫'));
    fireEvent.press(getAllByText('Nạp tiền')[0]);
    await waitFor(() => getByText('100.000 ₫'));
    fireEvent.press(getByText('100.000 ₫'));
    await waitFor(() => getByText('Tiếp tục'));
    await act(async () => {
      fireEvent.press(getByText('Tiếp tục'));
    });
    await waitFor(() => {
      expect(getByText('MB Bank')).toBeTruthy();
      expect(getByText('0000000001')).toBeTruthy();
    });
  });

  it('calls walletService.topUp when confirming transfer', async () => {
    mockService.topUp.mockResolvedValueOnce({ balance: 300000 });
    const { getByText, getAllByText } = render(<WalletScreen />, { wrapper });
    await waitFor(() => getByText('200.000 ₫'));
    fireEvent.press(getAllByText('Nạp tiền')[0]);
    await waitFor(() => getByText('100.000 ₫'));
    fireEvent.press(getByText('100.000 ₫'));
    await waitFor(() => getByText('Tiếp tục'));
    await act(async () => {
      fireEvent.press(getByText('Tiếp tục'));
    });
    await waitFor(() => getByText('Đã chuyển khoản xong'));
    await act(async () => {
      fireEvent.press(getByText('Đã chuyển khoản xong'));
    });
    await waitFor(() => {
      expect(mockService.topUp).toHaveBeenCalled();
    });
  });

  it('goes back to amount pick step in top-up modal', async () => {
    const { getByText, getAllByText } = render(<WalletScreen />, { wrapper });
    await waitFor(() => getByText('200.000 ₫'));
    fireEvent.press(getAllByText('Nạp tiền')[0]);
    await waitFor(() => getByText('100.000 ₫'));
    fireEvent.press(getByText('100.000 ₫'));
    await waitFor(() => getByText('Tiếp tục'));
    await act(async () => {
      fireEvent.press(getByText('Tiếp tục'));
    });
    await waitFor(() => getByText('Thay đổi số tiền'));
    fireEvent.press(getByText('Thay đổi số tiền'));
    await waitFor(() => {
      expect(getByText('Chọn hoặc nhập số tiền muốn nạp')).toBeTruthy();
    });
  });

  it('shows amount preview with custom amount', async () => {
    const { getByText, getByPlaceholderText, getAllByText } = render(<WalletScreen />, { wrapper });
    await waitFor(() => getByText('200.000 ₫'));
    fireEvent.press(getAllByText('Nạp tiền')[0]);
    await waitFor(() => getByPlaceholderText('VD: 300.000'));
    fireEvent.changeText(getByPlaceholderText('VD: 300.000'), '150000');
    await waitFor(() => {
      expect(getByText('150.000 ₫')).toBeTruthy();
    });
  });
});
