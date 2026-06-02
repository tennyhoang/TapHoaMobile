import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { router } from 'expo-router';
import { storage } from '@/lib/storage';
import { registerUnauthorizedHandler } from '@/lib/api';
import { registerPushNotifications } from '@/lib/notifications';

const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes in background

type User = {
  email: string;
  fullName: string;
  role: string;
  phoneNumber?: string;
};

type AuthContextType = {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (token: string, email: string, fullName: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (partial: Partial<User>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'taphoa_token';
const USER_KEY = 'taphoa_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load persisted session
  useEffect(() => {
    (async () => {
      try {
        const savedToken = await storage.getItem(TOKEN_KEY);
        const savedUser = await storage.getItem(USER_KEY);
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch {
        console.warn('Secure store read failed on first launch');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const logout = useCallback(async () => {
    await storage.deleteItem(TOKEN_KEY);
    await storage.deleteItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  // Register 401 handler so api.ts can trigger logout on expired token
  useEffect(() => {
    registerUnauthorizedHandler(() => {
      logout().then(() => {
        router.replace('/(auth)/login' as any);
      });
    });
  }, [logout]);

  // Session timeout: auto-logout after 15 min in background
  useEffect(() => {
    let backgroundedAt: number | null = null;
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'background' || state === 'inactive') {
        backgroundedAt = Date.now();
      } else if (state === 'active' && backgroundedAt !== null) {
        if (Date.now() - backgroundedAt > SESSION_TIMEOUT_MS && token) {
          logout().then(() => router.replace('/(auth)/login' as any));
        }
        backgroundedAt = null;
      }
    });
    return () => sub.remove();
  }, [token, logout]);

  const login = async (accessToken: string, email: string, fullName: string, role: string) => {
    const userData: User = { email, fullName, role };
    await storage.setItem(TOKEN_KEY, accessToken);
    await storage.setItem(USER_KEY, JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
    // Request push notification permission after successful login
    registerPushNotifications().catch(() => console.warn('Push notification registration failed'));
  };

  const updateUser = async (partial: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      storage.setItem(USER_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
