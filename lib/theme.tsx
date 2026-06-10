import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';

const LIGHT_COLORS = Colors.light;

export const LIGHT = {
  primary: '#0EA5AE' as string,
  primaryDark: '#067478' as string,
  text: LIGHT_COLORS.text,
  textSecondary: '#374151' as string,
  muted: LIGHT_COLORS.muted,
  bg: LIGHT_COLORS.background,
  card: LIGHT_COLORS.card,
  border: LIGHT_COLORS.border,
  inputBg: LIGHT_COLORS.inputBg,
  background: LIGHT_COLORS.background,
  isDark: false,
};

export const DARK: typeof LIGHT = {
  primary: '#14B8C4',
  primaryDark: '#0A8F98',
  text: '#F9FAFB',
  textSecondary: '#E5E7EB',
  muted: '#9CA3AF',
  bg: '#0D1117',
  card: '#1F2937',
  border: '#374151',
  inputBg: '#1F2937',
  background: '#0D1117',
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
