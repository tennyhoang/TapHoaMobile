import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';

export const LIGHT = {
  primary: '#0EA5AE',
  primaryDark: '#067478',
  text: '#111827',
  textSecondary: '#374151',
  muted: '#6B7280',
  bg: '#F8F9FA',
  card: '#FFFFFF',
  border: '#F3F4F6',
  inputBg: '#F9FAFB',
  isDark: false,
};

export const DARK = {
  primary: '#14B8C4',
  primaryDark: '#0A8F98',
  text: '#F9FAFB',
  textSecondary: '#E5E7EB',
  muted: '#9CA3AF',
  bg: '#111827',
  card: '#1F2937',
  border: '#374151',
  inputBg: '#1F2937',
  isDark: true,
};

export type Theme = typeof LIGHT;

const ThemeContext = createContext<Theme>(LIGHT);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? DARK : LIGHT;
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
