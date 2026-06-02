import React from 'react';
import { render, act } from '@testing-library/react-native';
import OfflineBanner from '@/components/OfflineBanner';

const mockAddEventListener = jest.fn();

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: (cb: (state: { isConnected: boolean }) => void) => {
    mockAddEventListener(cb);
    return jest.fn(); // unsubscribe
  },
}));

describe('OfflineBanner', () => {
  it('renders nothing when online', () => {
    const { toJSON } = render(<OfflineBanner />);
    // Simulates initial state (isOffline=false) → returns null
    expect(toJSON()).toBeNull();
  });

  it('renders banner when offline', () => {
    const { getByText } = render(<OfflineBanner />);

    act(() => {
      // Trigger the NetInfo listener with offline state
      const cb = mockAddEventListener.mock.calls[0]?.[0];
      if (cb) cb({ isConnected: false });
    });

    expect(getByText('Không có kết nối mạng')).toBeTruthy();
  });

  it('hides banner when connection restored', () => {
    const { toJSON } = render(<OfflineBanner />);

    act(() => {
      const cb = mockAddEventListener.mock.calls[0]?.[0];
      if (cb) {
        cb({ isConnected: false }); // go offline
        cb({ isConnected: true }); // come back online
      }
    });

    expect(toJSON()).toBeNull();
  });
});
