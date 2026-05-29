import React, { createContext, useContext, useState, useCallback } from 'react';
import { cartService } from '@/services/cart.service';

type CartContextType = {
  itemCount: number;
  refreshCount: () => Promise<void>;
};

const CartContext = createContext<CartContextType>({
  itemCount: 0,
  refreshCount: async () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [itemCount, setItemCount] = useState(0);

  const refreshCount = useCallback(async () => {
    try {
      const cart = await cartService.get();
      setItemCount(cart.totalItems);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <CartContext.Provider value={{ itemCount, refreshCount }}>{children}</CartContext.Provider>
  );
}

export function useCartCount() {
  return useContext(CartContext);
}
