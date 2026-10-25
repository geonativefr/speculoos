/*
 * Installs the fetch and Headers mocks in every test environment. Jest's `globals` option only
 * carries JSON-serializable values to its worker processes: functions and classes put there are
 * dropped when tests run in parallel, so the tests would get jsdom's own Headers instead.
 */
const {fetch, Headers} = require('./setup.js');

global.fetch = fetch;
global.Headers = Headers;
