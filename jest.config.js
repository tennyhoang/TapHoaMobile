/** @type {import('jest-expo/jest-preset').JestPreset} */
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./jest.setup.js'],
  clearMocks: true,
  cacheDirectory: '/tmp/jest-cache',
  testTimeout: 30000,
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  testPathIgnorePatterns: ['/node_modules/', '/.claude/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'services/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    '!**/_layout.tsx',
    '!**/+not-found.tsx',
    '!**/+html.tsx',
    '!**/modal.tsx',
    '!app/admin/**',
    '!app/agent/**',
    '!app/driver/**',
    '!**/*.web.ts',
    '!**/*.web.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 54,
      functions: 45,
      lines: 59,
      statements: 59,
    },
  },
  coverageReporters: ['text', 'lcov', 'json-summary'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/(?!native$)|@expo-google-fonts|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
};
