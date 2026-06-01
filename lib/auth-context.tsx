import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '@/lib/storage';

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
        // Ignore secure store errors on first launch
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (accessToken: string, email: string, fullName: string, role: string) => {
    const userData: User = { email, fullName, role };
    await storage.setItem(TOKEN_KEY, accessToken);
    await storage.setItem(USER_KEY, JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  };

  const logout = async () => {
    await storage.deleteItem(TOKEN_KEY);
    await storage.deleteItem(USER_KEY);
    setToken(null);
    setUser(null);
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
