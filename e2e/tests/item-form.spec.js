import { expect, test } from './fixtures.js';

test.describe('useItemForm', () => {
  test('after a creation, reset() keeps the created book and the next save updates it', async ({page, api}) => {
    await page.goto('/books/new');
    await page.getByLabel('Title').fill('Hyperion');
    await page.getByTestId('save').click();
    await expect(page.getByTestId('iri')).toHaveText('/api/books/3');

    await page.getByTestId('reset').click();
    await page.getByTestId('save').click();
    await expect(page.getByTestId('attempts')).toHaveText('2');

    const writes = [...await api.requests('POST'), ...await api.requests('PUT')];
    expect(writes.map(({method, path}) => `${method} ${path}`)).toEqual(['POST /api/books', 'PUT /api/books/3']);
    await expect(page.getByTestId('mode')).toHaveText('edition');
    await expect(page.getByLabel('Title')).toHaveValue('Hyperion');
  });

  test('the client headers reach the API on writes', async ({page, api}) => {
    await page.goto('/books/new');
    await page.getByLabel('Title').fill('Hyperion');
    await page.getByTestId('save').click();
    await expect(page.getByTestId('iri')).toHaveText('/api/books/3');

    await page.goto('/books/1');
    await page.getByLabel('Title').fill('Dune Messiah');
    await page.getByTestId('save').click();
    await expect(page.getByTestId('attempts')).toHaveText('1');

    const [post] = await api.requests('POST', '/api/books');
    expect(post.headers['accept-language']).toBe('fr');
    expect(post.headers['content-type']).toBe('application/json');
    const [put] = await api.requests('PUT', '/api/books/1');
    expect(put.headers['accept-language']).toBe('fr');
    expect(put.headers['content-type']).toBe('application/json');
  });
});

test.describe('API errors', () => {
  for (const hydraPrefix of [true, false]) {
    test.describe(hydraPrefix ? 'with the hydra: prefix' : 'without the hydra: prefix', () => {
      test.use({hydraPrefix});

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
        expect(request.settings.hydraPrefix).toBe(hydraPrefix);
      });
    });
  }

  test('an error the error handler takes care of leaves no error behind', async ({page, api}) => {
    await api.fail('GET', '/api/books/1', 401);
    await page.goto('/books/1');

    await expect(page.getByTestId('signed-out')).toBeVisible();
    await expect(page.getByTestId('app-errors')).toHaveText('');
  });
});
