module.exports = {
  extends: ['expo', 'prettier'],
  plugins: [],
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    // React Compiler is opt-in — disable its rules until we enable the compiler
    'react-compiler/react-compiler': 'off',
    // setState after async/await or inside setInterval is intentional and correct
    'react-hooks/set-state-in-effect': 'off',
  },
  env: {
    jest: true,
  },
  ignorePatterns: ['node_modules/', '.expo/', 'dist/', 'coverage/', 'android/', 'ios/'],
};
