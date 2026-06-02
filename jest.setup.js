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
  const { View } = require('react-native');
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
