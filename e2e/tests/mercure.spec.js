import { expect, test } from './fixtures.js';

// The application reconnects 2 seconds after a connection error
const RECONNECT_INTERVAL = 2000;
// The longest reconnection delay, consecutive failures included
const MAX_RECONNECT_DELAY = 30000;

test.describe('Mercure', () => {
  test('a topic subscribed while the connection is open receives its updates', async ({page, api}) => {
    await page.goto('/live');
    await expect(page.getByTestId('opens')).toHaveText('1');
    expect(await api.streams()).toEqual([{topics: ['/api/books/1']}]);

    await page.getByTestId('follow-author').click();
    await expect(page.getByTestId('author-name')).toHaveText('Frank Herbert');
    await expect.poll(() => api.streams()).toEqual([{topics: ['/api/books/1', '/api/authors/1']}]);

    await api.publish('/api/authors/1', {'@id': '/api/authors/1', '@type': 'Author', name: 'Frank P. Herbert'});
    await expect(page.getByTestId('author-name')).toHaveText('Frank P. Herbert');
  });

  test('a dropped connection reopens, and stop() keeps it closed', async ({page, api}) => {
    // Counts the connections the page opens, the moment it opens them
    await page.addInitScript(() => {
      window.openedEventSources = 0;
      window.EventSource = class extends window.EventSource {
        constructor(...args) {
          super(...args);
          window.openedEventSources++;
        }
      };
    });
    const openedEventSources = () => page.evaluate(() => window.openedEventSources);
    // The page's timers, the reconnection delay among them, only run when the test moves its clock
    await page.clock.install();
    await page.clock.pauseAt(new Date(Date.now() + 60000));
    await page.goto('/live');
    await expect(page.getByTestId('opens')).toHaveText('1');

    await api.drop();
    await expect(page.getByTestId('errors')).toHaveText('1');
    await page.clock.runFor(RECONNECT_INTERVAL);
    await expect(page.getByTestId('opens')).toHaveText('2');
    expect(await api.requests('GET', '/.well-known/mercure')).toHaveLength(2);

    await api.drop();
    await expect(page.getByTestId('errors')).toHaveText('2');
    await page.getByTestId('stop').click();
    await page.clock.runFor(MAX_RECONNECT_DELAY);
    expect(await openedEventSources()).toBe(2);
    expect(await api.requests('GET', '/.well-known/mercure')).toHaveLength(2);
    expect(await api.streams()).toEqual([]);
  });
});
