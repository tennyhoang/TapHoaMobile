import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View, useThemeColor } from '@/components/Themed';

describe('Themed components', () => {
  it('Text renders children', () => {
    const { getByText } = render(<Text>Hello</Text>);
    expect(getByText('Hello')).toBeTruthy();
  });

  it('View renders children', () => {
    const { getByText } = render(
      <View>
        <Text>Inside</Text>
      </View>
    );
    expect(getByText('Inside')).toBeTruthy();
  });

  it('useThemeColor returns a color string', () => {
    const { renderHook } = require('@testing-library/react-native');
    const { result } = renderHook(() => useThemeColor({}, 'text'));
    expect(typeof result.current).toBe('string');
  });

  it('useThemeColor returns lightColor when provided', () => {
    const { renderHook } = require('@testing-library/react-native');
    const { result } = renderHook(() => useThemeColor({ light: '#ff0000' }, 'text'));
    expect(result.current).toBe('#ff0000');
  });
});
