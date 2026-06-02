import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storage } from '@/lib/storage';

const WISHLIST_KEY = 'taphoa_wishlist';

type WishlistContextType = {
  ids: string[];
  isWishlisted: (id: string) => boolean;
  toggle: (id: string) => void;
};

const WishlistContext = createContext<WishlistContextType | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    storage
      .getItem(WISHLIST_KEY)
      .then(val => {
        if (val) setIds(JSON.parse(val));
      })
      .catch(() => console.warn('Failed to load wishlist from storage'));
  }, []);

  const isWishlisted = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback((id: string) => {
    setIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      storage
        .setItem(WISHLIST_KEY, JSON.stringify(next))
        .catch(() => console.warn('Failed to save wishlist to storage'));
      return next;
    });
  }, []);

  return (
    <WishlistContext.Provider value={{ ids, isWishlisted, toggle }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
