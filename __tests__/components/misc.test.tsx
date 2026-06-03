import React from 'react';
import { render } from '@testing-library/react-native';
import { MonoText } from '@/components/StyledText';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useColorScheme } from '@/components/useColorScheme';
import { renderHook } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn() }));

describe('MonoText', () => {
  it('renders children', () => {
    const { getByText } = render(<MonoText>Hello mono</MonoText>);
    expect(getByText('Hello mono')).toBeTruthy();
  });
});

describe('useClientOnlyValue', () => {
  it('returns client value', () => {
    const { result } = renderHook(() => useClientOnlyValue('server', 'client'));
    expect(result.current).toBe('client');
  });

  it('returns client value for any type', () => {
    const { result } = renderHook(() => useClientOnlyValue(false, true));
    expect(result.current).toBe(true);
  });
});

describe('useColorScheme', () => {
  it('returns a valid color scheme or null', () => {
    const { result } = renderHook(() => useColorScheme());
    expect(['light', 'dark', null].includes(result.current as any)).toBe(true);
  });
});
