import '@testing-library/react-native/extend-expect';

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  },
  useRouter: () => ({
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  }),
  Redirect: ({ href }: { href: string }) => null,
  Stack: { Screen: () => null },
}));

// Silence non-critical warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
};
