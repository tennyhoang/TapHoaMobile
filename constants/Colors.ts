import { useColorScheme } from 'react-native';

export const palette = {
  primary: '#0EA5AE',
  primaryDark: '#067478',
  primaryDarker: '#044F52',
  error: '#EF4444',
  success: '#22C55E',
  accent: '#F59E0B',
  star: '#F59E0B',
  heart: '#F43F5E',
  saleDark: '#D97706',
} as const;

const Colors = {
  light: {
    text: '#111827',
    background: '#F8F9FA',
    tint: palette.primary,
    tabIconDefault: '#9CA3AF',
    tabIconSelected: palette.primary,
    card: '#FFFFFF',
    muted: '#6B7280',
    border: '#F3F4F6',
    inputBg: '#F9FAFB',
    discount: palette.error,
    sale: palette.accent,
    ...palette,
    bg: '#F8F9FA' as string,
  },
  dark: {
    text: '#F9FAFB',
    background: '#0D1117',
    tint: palette.primary,
    tabIconDefault: '#6B7280',
    tabIconSelected: palette.primary,
    card: '#1C2333',
    muted: '#9CA3AF',
    border: '#2D3748',
    inputBg: '#1A2235',
    discount: palette.error,
    sale: palette.accent,
    ...palette,
    bg: '#0D1117' as string,
  },
};

export default Colors;

export const C = Colors.light;

export function useThemeColors() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? Colors.dark : Colors.light;
}
