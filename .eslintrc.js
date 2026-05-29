module.exports = {
  extends: ['expo', 'prettier'],
  plugins: [],
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
  },
  env: {
    jest: true,
  },
  ignorePatterns: ['node_modules/', '.expo/', 'dist/', 'coverage/', 'android/', 'ios/'],
};
