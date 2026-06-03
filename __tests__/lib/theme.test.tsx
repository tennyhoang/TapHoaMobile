import React from 'react';
import { renderHook } from '@testing-library/react-native';
import { ThemeProvider, useTheme, LIGHT, DARK } from '@/lib/theme';

function wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe('ThemeProvider / useTheme', () => {
  it('provides a theme object from context', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current).toBeDefined();
    expect(typeof result.current.primary).toBe('string');
    expect(typeof result.current.bg).toBe('string');
  });

  it('LIGHT constant has required keys', () => {
    const keys = ['primary', 'primaryDark', 'text', 'muted', 'bg', 'card', 'border', 'isDark'];
    keys.forEach(k => expect(LIGHT).toHaveProperty(k));
    expect(LIGHT.isDark).toBe(false);
  });

  it('DARK constant has isDark=true', () => {
    expect(DARK.isDark).toBe(true);
    expect(DARK.bg).not.toBe(LIGHT.bg);
  });
});
