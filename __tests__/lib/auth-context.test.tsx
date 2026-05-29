import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { AuthProvider, useAuth } from '../../lib/auth-context';

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthProvider / useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSecureStore.getItemAsync.mockResolvedValue(null);
    mockSecureStore.setItemAsync.mockResolvedValue();
    mockSecureStore.deleteItemAsync.mockResolvedValue();
  });

  afterEach(async () => {
    // Flush any pending async state updates from useEffect
    await act(async () => {});
  });

  describe('initial state', () => {
    it('starts loading and has no token or user', () => {
      // Keep SecureStore pending so the async effect never resolves during this test,
      // avoiding a state update outside act()
      mockSecureStore.getItemAsync.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.token).toBeNull();
      expect(result.current.user).toBeNull();
    });

    it('resolves isLoading to false after SecureStore check', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {});

      expect(result.current.isLoading).toBe(false);
    });

    it('restores token and user from SecureStore on mount', async () => {
      const savedUser = { email: 'a@b.com', fullName: 'Nguyễn A', role: 'Customer' };
      mockSecureStore.getItemAsync
        .mockResolvedValueOnce('saved-token')
        .mockResolvedValueOnce(JSON.stringify(savedUser));

      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});

      expect(result.current.token).toBe('saved-token');
      expect(result.current.user).toEqual(savedUser);
    });

    it('stays unauthenticated when SecureStore is empty', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});

      expect(result.current.token).toBeNull();
      expect(result.current.user).toBeNull();
    });
  });

  describe('login', () => {
    it('sets token and user in state and SecureStore', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});

      await act(async () => {
        await result.current.login('new-token', 'test@test.com', 'Trần B', 'Customer');
      });

      expect(result.current.token).toBe('new-token');
      expect(result.current.user).toEqual({
        email: 'test@test.com',
        fullName: 'Trần B',
        role: 'Customer',
      });
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('taphoa_token', 'new-token');
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        'taphoa_user',
        JSON.stringify({ email: 'test@test.com', fullName: 'Trần B', role: 'Customer' })
      );
    });
  });

  describe('logout', () => {
    it('clears token, user, and SecureStore', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});

      await act(async () => {
        await result.current.login('token', 'a@b.com', 'Người A', 'Customer');
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.token).toBeNull();
      expect(result.current.user).toBeNull();
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('taphoa_token');
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('taphoa_user');
    });
  });

  describe('updateUser', () => {
    it('merges partial update into existing user', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});

      await act(async () => {
        await result.current.login('tok', 'a@b.com', 'Tên Cũ', 'Customer');
      });

      await act(async () => {
        await result.current.updateUser({ fullName: 'Tên Mới' });
      });

      expect(result.current.user?.fullName).toBe('Tên Mới');
      expect(result.current.user?.email).toBe('a@b.com');
    });

    it('does nothing when user is null', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});

      await act(async () => {
        await result.current.updateUser({ fullName: 'Mới' });
      });

      expect(result.current.user).toBeNull();
    });

    it('persists updated user to SecureStore', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});

      await act(async () => {
        await result.current.login('tok', 'a@b.com', 'Cũ', 'Customer');
      });
      mockSecureStore.setItemAsync.mockClear();

      await act(async () => {
        await result.current.updateUser({ phoneNumber: '0912345678' });
      });

      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        'taphoa_user',
        expect.stringContaining('0912345678')
      );
    });
  });

  describe('useAuth outside provider', () => {
    it('throws when used outside AuthProvider', () => {
      expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within AuthProvider');
    });
  });
});
