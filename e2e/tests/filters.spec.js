import { expect, test } from './fixtures.js';

const lastBooksQuery = async (api) => {
  const requests = await api.requests('GET', '/api/books');
  return Object.fromEntries(new URLSearchParams(requests.at(-1)?.search));
};

test.describe('useFilters', () => {
  test('navigating to the list without query puts the filters back to their initial values', async ({page, api}) => {
    await page.goto('/books');
    await expect(page.getByTestId('total')).toHaveText('Total: 2');

    await page.getByLabel('Title').fill('dune');
    await page.getByLabel('history').check();
    await page.getByRole('button', {name: 'Filter'}).click();
    await expect(page.getByTestId('total')).toHaveText('Total: 0');
    expect(await lastBooksQuery(api)).toMatchObject({title: 'dune'});

    await page.getByTestId('all-books').click();
    await expect(page).toHaveURL(/\/books$/);
    await expect(page.getByTestId('total')).toHaveText('Total: 2');
    expect(await lastBooksQuery(api)).toEqual({});
    await expect(page.getByLabel('Title')).toHaveValue('');
    await expect(page.getByLabel('history')).not.toBeChecked();

    await page.getByRole('button', {name: 'Filter'}).click();
    await expect(page.getByTestId('total')).toHaveText('Total: 2');
    expect(await lastBooksQuery(api)).toEqual({});
  });

  // 2024-03-10 and 2024-03-31: the days the clocks change in New York and in Paris
  for (const timezoneId of ['Europe/Paris', 'America/New_York']) {
    test.describe(`in ${timezoneId}`, () => {
      test.use({timezoneId});

      test('a date range without time puts the picked dates in the query', async ({page, api}) => {
        await page.goto('/books');
        await page.getByLabel('Published after').fill('2024-03-10');
        await page.getByLabel('Published before').fill('2024-03-31');
        await page.getByRole('button', {name: 'Filter'}).click();

        await expect(page).toHaveURL(/publishedAt/);
        const query = new URL(page.url()).searchParams;
        expect([query.get('publishedAt[after]'), query.get('publishedAt[before]')]).toEqual(['2024-03-10', '2024-03-31']);
        await expect.poll(() => lastBooksQuery(api)).toEqual({
          'publishedAt[after]': '2024-03-10',
          'publishedAt[before]': '2024-03-31',
        });

        await page.reload();
        await expect(page.getByLabel('Published after')).toHaveValue('2024-03-10');
        await expect(page.getByLabel('Published before')).toHaveValue('2024-03-31');
      });
    });
  }
});
