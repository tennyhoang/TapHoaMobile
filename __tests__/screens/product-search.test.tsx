import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import SearchScreen from '@/app/product/search';
import { productsService } from '@/services/products.service';
import { categoriesService } from '@/services/categories.service';

jest.mock('@/services/products.service', () => ({
  productsService: { getAll: jest.fn() },
}));
jest.mock('@/services/categories.service', () => ({
  categoriesService: { getAll: jest.fn() },
}));
jest.mock('@/services/cart.service', () => ({
  cartService: { add: jest.fn() },
}));
jest.mock('@/lib/storage', () => ({
  storage: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
  },
}));
jest.mock('@/lib/layout', () => ({
  useLayout: () => ({ productColumns: 2, cardGap: 12, cardWidth: 180 }),
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('@/components/ProductCard', () => {
  const { Text } = require('react-native');
  return ({ product }: { product: any }) => (
    <Text testID={`product-${product.id}`}>{product.name}</Text>
  );
});

const mockProducts = jest.mocked(productsService);
const mockCategories = jest.mocked(categoriesService);

const emptyPage = { items: [], totalPages: 1, page: 1, total: 0 };
const sampleProduct = {
  id: 'p1',
  name: 'Táo đỏ',
  price: 50000,
  originalPrice: 60000,
  images: [],
  stock: 10,
  category: { id: 'c1', name: 'Trái cây' },
  isActive: true,
};

describe('SearchScreen', () => {
  beforeEach(() => {
    mockProducts.getAll.mockResolvedValue(emptyPage);
    mockCategories.getAll.mockResolvedValue([]);
  });

  it('renders search input with correct placeholder', async () => {
    const { getByPlaceholderText } = render(<SearchScreen />);
    await waitFor(() => {
      expect(getByPlaceholderText('Tìm thực phẩm tươi ngon...')).toBeTruthy();
    });
  });

  it('shows hint when no search query', async () => {
    const { getByText } = render(<SearchScreen />);
    await waitFor(() => {
      expect(getByText('Nhập tên sản phẩm để tìm kiếm')).toBeTruthy();
    });
  });

  it('shows history items when available', async () => {
    const { storage } = jest.requireMock('@/lib/storage');
    storage.getItem.mockResolvedValueOnce(JSON.stringify(['táo', 'cà rốt']));
    const { getByText } = render(<SearchScreen />);
    await waitFor(() => {
      expect(getByText('táo')).toBeTruthy();
      expect(getByText('Tìm kiếm gần đây')).toBeTruthy();
    });
  });

  it('clears history on clear all press', async () => {
    const { storage } = jest.requireMock('@/lib/storage');
    storage.getItem.mockResolvedValueOnce(JSON.stringify(['táo']));
    const { getByText, queryByText } = render(<SearchScreen />);
    await waitFor(() => expect(getByText('Xoá tất cả')).toBeTruthy());
    fireEvent.press(getByText('Xoá tất cả'));
    await waitFor(() => expect(queryByText('táo')).toBeNull());
  });

  it('opens filter modal on filter button press', async () => {
    const { UNSAFE_getAllByType, getByText } = render(<SearchScreen />);
    await waitFor(() => {});
    const { TouchableOpacity } = require('react-native');
    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(buttons[buttons.length - 1]);
    expect(getByText('Lọc & Sắp xếp')).toBeTruthy();
  });

  it('applies filter from modal', async () => {
    const { UNSAFE_getAllByType, getByText } = render(<SearchScreen />);
    await waitFor(() => {});
    const { TouchableOpacity } = require('react-native');
    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(buttons[buttons.length - 1]);
    fireEvent.press(getByText('Áp dụng'));
    expect(() => getByText('Lọc & Sắp xếp')).toThrow();
  });

  it('resets filter from modal', async () => {
    const { UNSAFE_getAllByType, getByText } = render(<SearchScreen />);
    await waitFor(() => {});
    const { TouchableOpacity } = require('react-native');
    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(buttons[buttons.length - 1]);
    fireEvent.press(getByText('Đặt lại'));
    expect(getByText('Lọc & Sắp xếp')).toBeTruthy();
  });

  it('shows products when search returns results', async () => {
    mockProducts.getAll.mockResolvedValue({
      items: [sampleProduct],
      totalPages: 1,
      page: 1,
      total: 1,
    });
    const { getByPlaceholderText, getByTestId } = render(<SearchScreen />);
    await waitFor(() => {});
    fireEvent.changeText(getByPlaceholderText('Tìm thực phẩm tươi ngon...'), 'táo');
    await act(async () => {
      await new Promise(r => setTimeout(r, 500));
    });
    await waitFor(() => expect(getByTestId('product-p1')).toBeTruthy());
  });

  it('clears search input when text is cleared', async () => {
    const { getByPlaceholderText } = render(<SearchScreen />);
    await waitFor(() => {});
    const input = getByPlaceholderText('Tìm thực phẩm tươi ngon...');
    fireEvent.changeText(input, 'test query');
    expect(input.props.value).toBe('test query');
    fireEvent.changeText(input, '');
    expect(input.props.value).toBe('');
  });

  it('navigates back on back button press', async () => {
    const { router } = jest.requireMock('expo-router');
    const { UNSAFE_getAllByType } = render(<SearchScreen />);
    await waitFor(() => {});
    const { TouchableOpacity } = require('react-native');
    fireEvent.press(UNSAFE_getAllByType(TouchableOpacity)[0]);
    expect(router.back).toHaveBeenCalled();
  });
});
