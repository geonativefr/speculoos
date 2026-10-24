import { expect, test as base } from '@playwright/test';
import { API_PORT } from '../ports.js';

const API_URL = `http://127.0.0.1:${API_PORT}`;

// Whether the fake API answered that request with the `hydra:` prefix
export const answeredWithPrefix = (request) => 'false' !== request.headers['x-hydra-prefix'];

export const test = base.extend({
  // Whether the fake API answers with the `hydra:` prefix, or without it as API Platform 4 does by default
  hydraPrefix: [true, {option: true}],

  // Drives the fake API and its Mercure hub; each test starts with the initial data and no request recorded
  api: async ({request}, use) => {
    const call = async (method, path, data) => {
      const response = await request.fetch(`${API_URL}/_e2e/${path}`, {method, data});
      expect(response.ok()).toBe(true);
      return response.json();
    };
    await call('POST', 'reset');
    await use({
      // The requests the fake API and the hub received, optionally those of one method and path
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

  page: async ({page, api, hydraPrefix}, use) => {
    await page.addInitScript((prefix) => localStorage.setItem('hydraPrefix', prefix), String(hydraPrefix));
    await use(page);
  },
});

export { expect };
