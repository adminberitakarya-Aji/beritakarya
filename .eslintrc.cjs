module.exports = {
  root: true,
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '.next/',
    '.turbo/',
    'coverage/'
  ],
  overrides: [
    {
      files: ['apps/api/**/*.ts', 'apps/web/**/*.ts', 'apps/web/**/*.tsx', 'packages/**/*.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      plugins: ['@typescript-eslint', 'react', 'react-hooks'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended'
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/no-unused-expressions': ['error', { allowTernary: true, allowShortCircuit: true }],
        '@typescript-eslint/no-namespace': 'off',
        '@typescript-eslint/no-require-imports': 'off',
        'prefer-const': 'off',
        'no-case-declarations': 'off',
        'no-empty': 'off',
        'react/react-in-jsx-scope': 'off',
        'react/prop-types': 'off',
        'react/no-unknown-property': ['error', { ignore: ['jsx'] }],
        'react-hooks/exhaustive-deps': 'off',
        'react-hooks/set-state-in-effect': 'off',
        'react-hooks/no-set-state-in-effect': 'off'
      },
      settings: {
        react: {
          version: 'detect'
        }
      }
    }
  ]
}
