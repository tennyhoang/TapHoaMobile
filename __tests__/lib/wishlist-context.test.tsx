import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';
import { WishlistProvider, useWishlist } from '@/lib/wishlist-context';

jest.mock('@/lib/storage', () => ({
  storage: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
  },
}));

function TestConsumer({ id }: { id: string }) {
  const { ids, isWishlisted, toggle } = useWishlist();
  return (
    <>
      <Text testID="count">{ids.length}</Text>
      <Text testID="wishlisted">{isWishlisted(id) ? 'yes' : 'no'}</Text>
      <TouchableOpacity testID="toggle" onPress={() => toggle(id)} />
    </>
  );
}

describe('WishlistProvider / useWishlist', () => {
  it('provides empty wishlist initially', async () => {
    const { getByTestId } = render(
      <WishlistProvider>
        <TestConsumer id="p1" />
      </WishlistProvider>
    );
    await waitFor(() => expect(getByTestId('count').props.children).toBe(0));
    expect(getByTestId('wishlisted').props.children).toBe('no');
  });

  it('loads wishlist from storage on mount', async () => {
    const { storage } = jest.requireMock('@/lib/storage');
    storage.getItem.mockResolvedValueOnce(JSON.stringify(['p1', 'p2']));
    const { getByTestId } = render(
      <WishlistProvider>
        <TestConsumer id="p1" />
      </WishlistProvider>
    );
    await waitFor(() => expect(getByTestId('count').props.children).toBe(2));
    expect(getByTestId('wishlisted').props.children).toBe('yes');
  });

  it('toggle adds an item', async () => {
    const { getByTestId: get } = render(
      <WishlistProvider>
        <TestConsumer id="p1" />
      </WishlistProvider>
    );
    await waitFor(() => expect(get('count').props.children).toBe(0));
    act(() => {
      require('@testing-library/react-native').fireEvent.press(get('toggle'));
    });
    expect(get('count').props.children).toBe(1);
    expect(get('wishlisted').props.children).toBe('yes');
  });

  it('toggle removes an existing item', async () => {
    const { storage } = jest.requireMock('@/lib/storage');
    storage.getItem.mockResolvedValueOnce(JSON.stringify(['p1']));
    const { getByTestId } = render(
      <WishlistProvider>
        <TestConsumer id="p1" />
      </WishlistProvider>
    );
    await waitFor(() => expect(getByTestId('wishlisted').props.children).toBe('yes'));
    act(() => {
      require('@testing-library/react-native').fireEvent.press(getByTestId('toggle'));
    });
    expect(getByTestId('wishlisted').props.children).toBe('no');
  });

  it('useWishlist throws outside provider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer id="x" />)).toThrow();
    consoleSpy.mockRestore();
  });
});
