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
};
