import { expect, test } from './fixtures.js';

// The application reconnects 2 seconds after a connection error
const RECONNECT_INTERVAL = 2000;

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
    await page.goto('/live');
    await expect(page.getByTestId('opens')).toHaveText('1');

    await api.drop();
    await expect(page.getByTestId('errors')).toHaveText('1');
    await expect(page.getByTestId('opens')).toHaveText('2');
    expect(await api.requests('GET', '/.well-known/mercure')).toHaveLength(2);

    await api.drop();
    await expect(page.getByTestId('errors')).toHaveText('2');
    await page.getByTestId('stop').click();
    // Nothing to wait for: no connection must reach the hub after the reconnection delay
    await page.waitForTimeout(RECONNECT_INTERVAL + 1000);
    expect(await api.requests('GET', '/.well-known/mercure')).toHaveLength(2);
    expect(await api.streams()).toEqual([]);
  });
});
