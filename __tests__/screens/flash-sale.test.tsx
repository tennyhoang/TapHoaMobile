import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import FlashSaleScreen from '@/app/flash-sale';
import { flashSaleService } from '@/services/flashsale.service';

jest.mock('@/services/flashsale.service', () => ({
  flashSaleService: { getCurrent: jest.fn() },
}));

jest.mock('@/services/cart.service', () => ({
  cartService: { add: jest.fn() },
}));

jest.mock('@/components/Toast', () => ({
  useToast: () => ({ show: jest.fn() }),
}));

jest.mock('@/lib/layout', () => ({
  useLayout: () => ({ productColumns: 2, cardGap: 12 }),
}));

jest.mock('@/components/ProductImage', () => {
  const { View } = jest.requireActual('react-native');
  const Mock = () => <View testID="product-image" />;
  Mock.displayName = 'ProductImage';
  return Mock;
});

jest.mock('@/components/EmptyState', () => {
  const { View, Text, TouchableOpacity } = jest.requireActual('react-native');
  const Mock = ({ title, subtitle, action }: any) => (
    <View>
      <Text>{title}</Text>
      {subtitle && <Text>{subtitle}</Text>}
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

jest.mock('@/lib/cart-context', () => ({
  useCartCount: () => ({ refreshCount: jest.fn() }),
}));

jest.mock('@/lib/utils', () => ({
  formatCurrency: (amount: number) => `${amount}₫`,
  formatCountdown: () => '12:30:00',
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('expo-image', () => ({
  Image: () => null,
}));

jest.setTimeout(30000);

const wrapper = ({ children }: any) => <SafeAreaProvider>{children}</SafeAreaProvider>;

const mockProduct1 = {
  id: 'fp1',
  name: 'Gạo ST25 Flash',
  thumbnailUrl: 'https://example.com/img1.jpg',
  categoryName: 'Gạo',
  originalPrice: 50000,
  flashSalePrice: 35000,
  flashSaleStock: 50,
  soldCount: 15,
  stockRemaining: 35,
};

const mockProduct2 = {
  id: 'fp2',
  name: 'Mì Siêu Rẻ',
  thumbnailUrl: 'https://example.com/img2.jpg',
  categoryName: 'Mì',
  originalPrice: 10000,
  flashSalePrice: 5000,
  flashSaleStock: 20,
  soldCount: 18,
  stockRemaining: 2,
};

const mockProduct3 = {
  id: 'fp3',
  name: 'Dầu Ăn Hết',
  thumbnailUrl: null,
  categoryName: 'Dầu',
  originalPrice: 40000,
  flashSalePrice: 30000,
  flashSaleStock: 10,
  soldCount: 10,
  stockRemaining: 0,
};

const mockSession = {
  sessionId: 's1',
  name: 'Flash Sale Cuối Tuần',
  startTime: '2025-01-01T10:00:00Z',
  endTime: '2025-01-01T22:00:00Z',
  products: [mockProduct1, mockProduct2, mockProduct3],
};

describe('FlashSaleScreen', () => {
  it('shows loading indicator initially', () => {
    (flashSaleService.getCurrent as jest.Mock).mockReturnValue(new Promise(() => {}));
    const { toJSON } = render(<FlashSaleScreen />, { wrapper });
    expect(toJSON()).not.toBeNull();
    expect(flashSaleService.getCurrent).toHaveBeenCalled();
  });

  it('shows empty state when no flash sale is active', async () => {
    (flashSaleService.getCurrent as jest.Mock).mockResolvedValue(null);
    const { getByText } = render(<FlashSaleScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Không có Flash Sale')).toBeTruthy();
    });
  });

  it('shows subtitle in empty state', async () => {
    (flashSaleService.getCurrent as jest.Mock).mockResolvedValue(null);
    const { getByText } = render(<FlashSaleScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Hiện chưa có phiên Flash Sale nào đang diễn ra')).toBeTruthy();
    });
  });

  it('navigates to products when "Xem sản phẩm thường" is pressed', async () => {
    (flashSaleService.getCurrent as jest.Mock).mockResolvedValue(null);
    const { getByText } = render(<FlashSaleScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Xem sản phẩm thường')).toBeTruthy();
    });
    const { router } = jest.requireMock('expo-router');
    fireEvent.press(getByText('Xem sản phẩm thường'));
    expect(router.push).toHaveBeenCalledWith('/(tabs)/products');
  });

  it('renders products when session is active', async () => {
    jest.useFakeTimers();
    (flashSaleService.getCurrent as jest.Mock).mockResolvedValue(mockSession);
    const { getByText } = render(<FlashSaleScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Gạo ST25 Flash')).toBeTruthy();
      expect(getByText('Mì Siêu Rẻ')).toBeTruthy();
      expect(getByText('Dầu Ăn Hết')).toBeTruthy();
    });
  });

  it('shows "Flash Sale" title', async () => {
    jest.useFakeTimers();
    (flashSaleService.getCurrent as jest.Mock).mockResolvedValue(mockSession);
    const { getByText } = render(<FlashSaleScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Flash Sale')).toBeTruthy();
    });
  });

  it('shows session name in header', async () => {
    jest.useFakeTimers();
    (flashSaleService.getCurrent as jest.Mock).mockResolvedValue(mockSession);
    const { getByText } = render(<FlashSaleScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Flash Sale Cuối Tuần')).toBeTruthy();
    });
  });

  it('shows countdown timer', async () => {
    jest.useFakeTimers();
    (flashSaleService.getCurrent as jest.Mock).mockResolvedValue(mockSession);
    const { getByText } = render(<FlashSaleScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('12:30:00')).toBeTruthy();
    });
  });

  it('shows "Kết thúc sau" label', async () => {
    jest.useFakeTimers();
    (flashSaleService.getCurrent as jest.Mock).mockResolvedValue(mockSession);
    const { getByText } = render(<FlashSaleScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Kết thúc sau')).toBeTruthy();
    });
  });

  it('shows banner with product count', async () => {
    jest.useFakeTimers();
    (flashSaleService.getCurrent as jest.Mock).mockResolvedValue(mockSession);
    const { getByText } = render(<FlashSaleScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText(/3 sản phẩm giảm giá sốc/)).toBeTruthy();
    });
  });

  it('shows discount percentage badge', async () => {
    jest.useFakeTimers();
    (flashSaleService.getCurrent as jest.Mock).mockResolvedValue(mockSession);
    const { getByText } = render(<FlashSaleScreen />, { wrapper });
    // (50000-35000)/50000 = 30%
    await waitFor(() => {
      expect(getByText('-30%')).toBeTruthy();
    });
  });

  it('shows low stock badge for products with <= 5 remaining', async () => {
    jest.useFakeTimers();
    (flashSaleService.getCurrent as jest.Mock).mockResolvedValue(mockSession);
    const { getByText } = render(<FlashSaleScreen />, { wrapper });
    // product2 has stockRemaining=2
    await waitFor(() => {
      expect(getByText('Còn 2')).toBeTruthy();
    });
  });

  it('shows sold out state when stock remaining is 0', async () => {
    jest.useFakeTimers();
    (flashSaleService.getCurrent as jest.Mock).mockResolvedValue(mockSession);
    const { getByText } = render(<FlashSaleScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Hết')).toBeTruthy();
    });
  });

  it('renders flash sale prices', async () => {
    jest.useFakeTimers();
    (flashSaleService.getCurrent as jest.Mock).mockResolvedValue(mockSession);
    const { getByText } = render(<FlashSaleScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('35000₫')).toBeTruthy();
      expect(getByText('50000₫')).toBeTruthy();
    });
  });

  it('renders category names for products', async () => {
    jest.useFakeTimers();
    (flashSaleService.getCurrent as jest.Mock).mockResolvedValue(mockSession);
    const { getByText } = render(<FlashSaleScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Gạo')).toBeTruthy();
      expect(getByText('Mì')).toBeTruthy();
      expect(getByText('Dầu')).toBeTruthy();
    });
  });
});
