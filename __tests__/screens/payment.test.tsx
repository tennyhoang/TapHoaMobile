import React from 'react';
import { render, act } from '@testing-library/react-native';
import PaymentWebViewScreen from '@/app/payment/index';
import { router } from 'expo-router';

jest.mock('react-native-webview', () => {
  const { View } = jest.requireActual('react-native');
  const WebView = ({ onLoad, onNavigationStateChange, source }: any) => {
    // Expose handlers for tests via testID
    return (
      <View
        testID="webview"
        onLayout={() => {
          if (onLoad) onLoad();
        }}
        // store handlers for imperative access in tests
        {...{ _onLoad: onLoad, _onNavChange: onNavigationStateChange, _source: source }}
      />
    );
  };
  WebView.displayName = 'WebView';
  return { WebView, default: WebView };
});

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

const mockRouter = jest.mocked(router);

const mockLocalSearchParams: Record<string, string> = {};

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), back: jest.fn(), push: jest.fn() },
  useLocalSearchParams: () => mockLocalSearchParams,
}));

function setParams(params: Record<string, string>) {
  Object.keys(mockLocalSearchParams).forEach(k => delete mockLocalSearchParams[k]);
  Object.assign(mockLocalSearchParams, params);
}

describe('PaymentWebViewScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    setParams({ url: 'https://pay.vnpay.vn/test', orderId: 'order-1', gateway: 'vnpay' });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows error message when no URL provided', () => {
    setParams({ orderId: 'order-1', gateway: 'vnpay' });
    const { getByText } = render(<PaymentWebViewScreen />);
    expect(getByText('Không có URL thanh toán')).toBeTruthy();
  });

  it('shows loading text while WebView connects', () => {
    const { getByText } = render(<PaymentWebViewScreen />);
    expect(getByText('Đang kết nối cổng thanh toán...')).toBeTruthy();
  });

  it('renders without crashing when URL is provided', () => {
    const { toJSON } = render(<PaymentWebViewScreen />);
    expect(toJSON()).not.toBeNull();
  });

  it('shows success screen on VNPay success response code', async () => {
    const { getByTestId, getByText } = render(<PaymentWebViewScreen />);
    const webview = getByTestId('webview');

    await act(async () => {
      (webview.props as any)._onNavChange?.({
        url: 'https://return.taphoa.vn/vnpay-return?vnp_ResponseCode=00',
      });
    });

    expect(getByText('Thanh toán thành công!')).toBeTruthy();
    expect(getByText('Đang chuyển về đơn hàng...')).toBeTruthy();
  });

  it('redirects to order after VNPay success', async () => {
    const { getByTestId } = render(<PaymentWebViewScreen />);
    const webview = getByTestId('webview');

    await act(async () => {
      (webview.props as any)._onNavChange?.({
        url: 'https://return.taphoa.vn?vnp_ResponseCode=00',
      });
    });

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(mockRouter.replace).toHaveBeenCalledWith('/order/order-1');
  });

  it('shows success screen on MoMo success result code', async () => {
    const { getByTestId, getByText } = render(<PaymentWebViewScreen />);
    const webview = getByTestId('webview');

    await act(async () => {
      (webview.props as any)._onNavChange?.({
        url: 'https://return.taphoa.vn/momo-return?resultCode=0',
      });
    });

    expect(getByText('Thanh toán thành công!')).toBeTruthy();
  });

  it('calls router.back() on VNPay cancelled (code 24)', async () => {
    const { getByTestId } = render(<PaymentWebViewScreen />);
    const webview = getByTestId('webview');

    await act(async () => {
      (webview.props as any)._onNavChange?.({
        url: 'https://return.taphoa.vn?vnp_ResponseCode=24',
      });
    });

    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('calls router.back() on MoMo cancelled (resultCode 9000)', async () => {
    const { getByTestId } = render(<PaymentWebViewScreen />);
    const webview = getByTestId('webview');

    await act(async () => {
      (webview.props as any)._onNavChange?.({
        url: 'https://return.taphoa.vn?resultCode=9000',
      });
    });

    expect(mockRouter.back).toHaveBeenCalled();
  });
});
