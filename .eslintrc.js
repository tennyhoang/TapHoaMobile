module.exports = {
  extends: ['expo', 'prettier'],
  plugins: [],
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'off',
    // React Compiler is opt-in — disable its rules until we enable the compiler
    'react-compiler/react-compiler': 'off',
    // setState after async/await or inside setInterval is intentional and correct
    'react-hooks/set-state-in-effect': 'off',
    // useMemo animation values and intentionally split effects trigger false positives
    'react-hooks/exhaustive-deps': 'off',
  },
  env: {
    jest: true,
  },
  ignorePatterns: ['node_modules/', '.expo/', 'dist/', 'coverage/', 'android/', 'ios/'],
  overrides: [
    {
      files: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
      rules: {
        // jest.mock() factories must use require() — ES imports are not allowed inside them
        '@typescript-eslint/no-require-imports': 'off',
        'react/display-name': 'off',
        'no-console': 'off',
      },
    },
  ],
};
