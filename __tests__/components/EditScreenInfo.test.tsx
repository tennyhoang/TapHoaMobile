import React from 'react';
import { render } from '@testing-library/react-native';
import EditScreenInfo from '@/components/EditScreenInfo';

jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn() }));

describe('EditScreenInfo', () => {
  it('renders the path', () => {
    const { getByText } = render(<EditScreenInfo path="app/(tabs)/index.tsx" />);
    expect(getByText('app/(tabs)/index.tsx')).toBeTruthy();
  });

  it('renders instructional text', () => {
    const { getByText } = render(<EditScreenInfo path="any/path.tsx" />);
    expect(getByText(/Open up the code/)).toBeTruthy();
  });
});
