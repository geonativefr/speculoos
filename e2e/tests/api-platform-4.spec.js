import { answeredWithPrefix, expect, test } from './fixtures.js';

for (const hydraPrefix of [false, true]) {
  test.describe(hydraPrefix ? 'with the hydra: prefix' : 'without the hydra: prefix (API Platform 4)', () => {
    test.use({hydraPrefix});

    test('a collection lists its members and its total', async ({page, api}) => {
      await page.goto('/books');

      await expect(page.getByTestId('total')).toHaveText('Total: 2');
      await expect(page.getByTestId('books').getByRole('listitem')).toHaveText(['Dune', 'The Dispossessed']);
      const [request] = await api.requests('GET', '/api/books');
      expect(answeredWithPrefix(request)).toBe(hydraPrefix);
    });

    test('a validation error shows the field violations', async ({page, api}) => {
      await page.goto('/books/new');
      await page.getByTestId('save').click();

      await expect(page.getByTestId('violations').getByRole('listitem')).toHaveText(['title: This value should not be blank.']);
      await expect(page.getByLabel('Title')).toHaveJSProperty('validationMessage', 'This value should not be blank.');
      await expect(page.getByTestId('error')).toHaveCount(0);
      const [request] = await api.requests('POST', '/api/books');
      expect(answeredWithPrefix(request)).toBe(hydraPrefix);
    });
  });
}
