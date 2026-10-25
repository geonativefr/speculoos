import { expect, test } from './fixtures.js';

test.describe('Error responses that are not Hydra', () => {
  test('a 401 with a JSON body without @type reaches the error handler with its status', async ({page, api}) => {
    // The body an authentication firewall sends, outside of API Platform
    await api.fail('GET', '/api/books/1', 401, {code: 401, message: 'JWT Token not found'});
    await page.goto('/books/1');

    await expect(page.getByTestId('signed-out')).toBeVisible();
    await expect(page.getByTestId('settled-book-loads')).toHaveText('1');
    await expect(page.getByTestId('app-errors')).toHaveText('');
  });
});
