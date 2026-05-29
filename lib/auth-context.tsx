import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

type User = {
  email: string;
  fullName: string;
  role: string;
};

type AuthContextType = {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (token: string, email: string, fullName: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
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
        const savedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        const savedUser = await SecureStore.getItemAsync(USER_KEY);
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
    await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
