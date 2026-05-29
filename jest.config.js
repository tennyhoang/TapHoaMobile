/** @type {import('jest-expo/jest-preset').JestPreset} */
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'services/**/*.{ts,tsx}',
    '!**/_layout.tsx',
    '!**/+not-found.tsx',
    '!**/+html.tsx',
  ],
  coverageReporters: ['text', 'lcov', 'json-summary'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/(?!native$)|@expo-google-fonts|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
};
