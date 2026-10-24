require('dotenv').config();

module.exports = {
  'modulePaths': ['src'],
  'moduleDirectories': ['node_modules'],
  'moduleNameMapper': {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  verbose: true,
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/src/api-client/tests/globals.js'],
  // The end-to-end tests run with Playwright (yarn e2e)
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/e2e/'],
};
