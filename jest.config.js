require('dotenv').config();
const {fetch, Headers} = require(__dirname + '/src/api-client/tests/setup.js');

module.exports = {
  'modulePaths': ['src'],
  'moduleDirectories': ['node_modules'],
  'moduleNameMapper': {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  verbose: true,
  testEnvironment: 'jsdom',
  globals: {
    fetch,
    Headers,
  }
};
