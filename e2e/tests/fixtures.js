import { expect, test as base } from '@playwright/test';
import { API_PORT } from '../ports.js';

const API_URL = `http://127.0.0.1:${API_PORT}`;

export const test = base.extend({
  // Whether the fake API answers with the `hydra:` prefix, or without it as API Platform 4 does by default
  hydraPrefix: [true, {option: true}],
  // The @type of the validation errors of the fake API: ConstraintViolationList, or ConstraintViolation as API Platform 4
  violationType: ['ConstraintViolationList', {option: true}],

  /*
   * Drives the fake API and its Mercure hub; each test starts with the initial data, no request recorded, and the
   * payloads in the form of the options above, set on the server and never by the application under test
   */
  api: async ({request, hydraPrefix, violationType}, use) => {
    const call = async (method, path, data) => {
      const response = await request.fetch(`${API_URL}/_e2e/${path}`, {method, data});
      expect(response.ok()).toBe(true);
      return response.json();
    };
    await call('POST', 'reset');
    await call('POST', 'settings', {hydraPrefix, violationType});
    await use({
      // The requests the fake API and the hub received, optionally those of one method and path, with the settings
      // they were answered with
      requests: async (method, path) => (await call('GET', 'requests'))
        .filter(request => (undefined === method || method === request.method) && (undefined === path || path === request.path)),
      // The next request of that method and path fails with that status
      fail: (method, path, status) => call('POST', 'fail', {method, path, status}),
      publish: (topic, data) => call('POST', 'publish', {topic, data}),
      // The topics of each open stream of the hub
      streams: () => call('GET', 'streams'),
      // Drops the open streams of the hub, as a network failure would
      drop: () => call('POST', 'drop'),
    });
  },
});

export { expect };
