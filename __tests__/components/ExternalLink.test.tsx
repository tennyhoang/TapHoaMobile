import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ExternalLink } from '@/components/ExternalLink';

jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn() }));

jest.mock('expo-router', () => {
  const { TouchableOpacity } = require('react-native');
  return {
    router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
    useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
    useLocalSearchParams: () => ({}),
    useFocusEffect: (cb: () => void) => {
      require('react').useEffect(() => cb(), []);
    },
    Redirect: () => null,
    Stack: { Screen: () => null },
    Link: ({ children, onPress }: any) => (
      <TouchableOpacity onPress={onPress}>{children}</TouchableOpacity>
    ),
  };
});

describe('ExternalLink', () => {
  it('renders children', () => {
    const { Text } = require('react-native');
    const { getByText } = render(
      <ExternalLink href="https://example.com">
        <Text>Click me</Text>
      </ExternalLink>
    );
    expect(getByText('Click me')).toBeTruthy();
  });

  it('opens browser on press (native platform)', () => {
    const WebBrowser = jest.requireMock('expo-web-browser');
    const { Text } = require('react-native');
    const { UNSAFE_getByType } = render(
      <ExternalLink href="https://example.com">
        <Text>Open</Text>
      </ExternalLink>
    );
    const { TouchableOpacity } = require('react-native');
    fireEvent.press(UNSAFE_getByType(TouchableOpacity), { preventDefault: jest.fn() });
    expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith('https://example.com');
  });
});
