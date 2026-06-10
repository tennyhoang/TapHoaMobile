// Mock react-native-reanimated (full manual mock — avoids Worklets native init)
jest.mock('react-native-reanimated', () => {
  const { View, Text, Image, ScrollView } = require('react-native');
  const mock = {
    default: { View, Text, Image, ScrollView, createAnimatedComponent: c => c },
    View,
    Text,
    Image,
    ScrollView,
    createAnimatedComponent: c => c,
    useSharedValue: v => ({ value: v }),
    useDerivedValue: fn => ({ value: fn() }),
    useAnimatedStyle: () => ({}),
    useAnimatedScrollHandler: () => ({}),
    withSpring: v => v,
    withTiming: v => v,
    withRepeat: v => v,
    withSequence: (...args) => args[args.length - 1],
    withDelay: (_d, v) => v,
    interpolate: () => 0,
    Extrapolation: { CLAMP: 'CLAMP' },
    Easing: { inOut: () => 0, ease: 0, linear: 0 },
    runOnUI: fn => fn,
    runOnJS: fn => fn,
    cancelAnimation: jest.fn(),
    FadeIn: {},
    FadeOut: {},
    SlideInRight: {},
    SlideOutLeft: {},
  };
  return mock;
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Suppress act() warnings — unavoidable with async state updates in useEffect chains
const _origError = console.error.bind(console);
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('not wrapped in act')) return;
  _origError(...args);
};

// Mock expo-localization (used by lib/i18n.ts)
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'vi', regionCode: 'VN' }],
}));

// Mock react-i18next and i18next globally so useTranslation() works in tests
jest.mock('react-i18next', () => {
  const vi = require('./locales/vi.json');
  function t(key, fallback) {
    const parts = String(key).split('.');
    let val = vi;
    for (const p of parts) {
      if (val && typeof val === 'object' && p in val) { val = val[p]; }
      else { return typeof fallback === 'string' ? fallback : key; }
    }
    return typeof val === 'string' ? val : key;
  }
  return {
    useTranslation: () => ({ t, i18n: { language: 'vi', changeLanguage: jest.fn() } }),
    initReactI18next: { type: '3rdParty', init: () => {} },
    Trans: ({ children }) => children,
  };
});

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
  useLocalSearchParams: () => ({}),
  useFocusEffect: cb => { require('react').useEffect(() => cb(), []); },
  Redirect: () => null,
  Stack: { Screen: () => null },
  Link: ({ children }) => children,
}));
