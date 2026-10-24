import { expect, test } from './fixtures.js';

// The forms of the payloads the fake API answers with
const forms = [
  {title: 'without the hydra: prefix (API Platform 4)', hydraPrefix: false, violationType: 'ConstraintViolation'},
  {title: 'with the hydra: prefix', hydraPrefix: true, violationType: 'ConstraintViolationList'},
  {
    title: 'with the hydra: prefix and ConstraintViolation errors (API Platform 4.2, hydra_prefix: true)',
    hydraPrefix: true,
    violationType: 'ConstraintViolation',
  },
];

test.describe('API Platform 4 payloads', () => {
  for (const {title, hydraPrefix, violationType} of forms) {
    test.describe(title, () => {
      test.use({hydraPrefix, violationType});

      test('a collection lists its members and its total', async ({page, api}) => {
        await page.goto('/books');

        await expect(page.getByTestId('total')).toHaveText('Total: 2');
        await expect(page.getByTestId('books').getByRole('listitem')).toHaveText(['Dune', 'The Dispossessed']);
        const [request] = await api.requests('GET', '/api/books');
        expect(request.settings).toEqual({hydraPrefix, violationType});
      });

      test('a validation error shows the field violations', async ({page, api}) => {
        await page.goto('/books/new');
        await page.getByTestId('save').click();

        await expect(page.getByTestId('violations').getByRole('listitem')).toHaveText(['title: This value should not be blank.']);
        await expect(page.getByLabel('Title')).toHaveJSProperty('validationMessage', 'This value should not be blank.');
        await expect(page.getByTestId('error')).toHaveCount(0);
        const [request] = await api.requests('POST', '/api/books');
        expect(request.settings).toEqual({hydraPrefix, violationType});
      });

      test('a server error on save reaches the form', async ({page, api}) => {
        await api.fail('POST', '/api/books', 500);
        await page.goto('/books/new');
        await page.getByLabel('Title').fill('Hyperion');
        await page.getByTestId('save').click();

        await expect(page.getByTestId('error')).toHaveText('HydraError 500 Internal Server Error');
        await expect(page.getByTestId('mode')).toHaveText('creation');
        await expect(page.getByLabel('Title')).toHaveValue('Hyperion');
        await expect(page.getByTestId('app-errors')).toHaveText('');
        const [request] = await api.requests('POST', '/api/books');
        expect(request.settings).toEqual({hydraPrefix, violationType});
      });
    });
  }
});
