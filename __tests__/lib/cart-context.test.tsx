import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { CartProvider, useCartCount } from '../../lib/cart-context';
import { cartService } from '../../services/cart.service';

jest.mock('../../services/cart.service', () => ({
  cartService: {
    get: jest.fn(),
  },
}));

const mockCartService = cartService as jest.Mocked<typeof cartService>;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

describe('CartProvider / useCartCount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('starts with itemCount of 0', () => {
      const { result } = renderHook(() => useCartCount(), { wrapper });

      expect(result.current.itemCount).toBe(0);
    });
  });

  describe('refreshCount', () => {
    it('fetches cart and updates itemCount', async () => {
      mockCartService.get.mockResolvedValueOnce({
        items: [],
        totalAmount: 0,
        totalItems: 3,
      });

      const { result } = renderHook(() => useCartCount(), { wrapper });

      await act(async () => {
        await result.current.refreshCount();
      });

      expect(result.current.itemCount).toBe(3);
      expect(mockCartService.get).toHaveBeenCalledTimes(1);
    });

    it('does not change itemCount when cart fetch fails', async () => {
      mockCartService.get.mockRejectedValueOnce(new Error('Lỗi mạng'));

      const { result } = renderHook(() => useCartCount(), { wrapper });

      await act(async () => {
        await result.current.refreshCount();
      });

      expect(result.current.itemCount).toBe(0);
    });

    it('updates itemCount correctly on multiple refreshes', async () => {
      mockCartService.get
        .mockResolvedValueOnce({ items: [], totalAmount: 0, totalItems: 2 })
        .mockResolvedValueOnce({ items: [], totalAmount: 0, totalItems: 5 });

      const { result } = renderHook(() => useCartCount(), { wrapper });

      await act(async () => {
        await result.current.refreshCount();
      });
      expect(result.current.itemCount).toBe(2);

      await act(async () => {
        await result.current.refreshCount();
      });
      expect(result.current.itemCount).toBe(5);
    });

    it('resets to 0 when cart becomes empty', async () => {
      mockCartService.get
        .mockResolvedValueOnce({ items: [], totalAmount: 0, totalItems: 4 })
        .mockResolvedValueOnce({ items: [], totalAmount: 0, totalItems: 0 });

      const { result } = renderHook(() => useCartCount(), { wrapper });

      await act(async () => {
        await result.current.refreshCount();
      });
      expect(result.current.itemCount).toBe(4);

      await act(async () => {
        await result.current.refreshCount();
      });
      expect(result.current.itemCount).toBe(0);
    });
  });

  describe('useCartCount outside provider', () => {
    it('returns default context values (no throw)', () => {
      const { result } = renderHook(() => useCartCount());

      expect(result.current.itemCount).toBe(0);
      expect(typeof result.current.refreshCount).toBe('function');
    });
  });
});
