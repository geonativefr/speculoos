module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    'prettier',
  ],
  parserOptions: {
    parser: '@babel/eslint-parser',
    ecmaVersion: 8,
    sourceType: 'module',
    requireConfigFile: false,
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-unused-vars': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'vue/one-component-per-file': process.env.NODE_ENV === 'test' ? 'off' : 'warn',
    semi: ['error', 'always'],
    quotes: ['error', 'single'],
  },
  overrides: [
    {
      files: [
        '**/*.test.{j,t}s?(x)',
      ],
      env: {
        jest: true,
      },
    },
  ],
  'ignorePatterns': ['/node_modules/*', '/dist/*'],
};
