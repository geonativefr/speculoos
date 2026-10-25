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
  test('an error the error handler takes care of leaves no error behind', async ({page, api}) => {
    await api.fail('GET', '/api/books/1', 401);
    await page.goto('/books/1');

    await expect(page.getByTestId('signed-out')).toBeVisible();
    // The load of the book has settled, and any error it left is listed
    await expect(page.getByTestId('settled-book-loads')).toHaveText('1');
    await expect(page.getByTestId('app-errors')).toHaveText('');
  });

  test('a failed save the error handler takes care of keeps what was typed and the mode of the form', async ({page, api}) => {
    await api.fail('POST', '/api/books', 503);
    await page.goto('/books/new');
    await page.getByLabel('Title').fill('Hyperion');
    await page.getByTestId('save').click();

    // The save has settled and the error handler took care of it
    await expect(page.getByTestId('attempts')).toHaveText('1');
    await expect(page.getByTestId('notice')).toBeVisible();
    await expect(page.getByLabel('Title')).toHaveValue('Hyperion');
    await expect(page.getByTestId('mode')).toHaveText('creation');

    await api.fail('PUT', '/api/books/1', 503);
    await page.goto('/books/1');
    await expect(page.getByLabel('Title')).toHaveValue('Dune');
    await page.getByLabel('Title').fill('Dune Messiah');
    await page.getByTestId('save').click();

    await expect(page.getByTestId('attempts')).toHaveText('1');
    await expect(page.getByTestId('notice')).toBeVisible();
    await expect(page.getByLabel('Title')).toHaveValue('Dune Messiah');
    await expect(page.getByTestId('mode')).toHaveText('edition');
    await expect(page.getByTestId('iri')).toHaveText('/api/books/1');

    // reset() goes back to the last saved state, the book as loaded
    await page.getByTestId('reset').click();
    await expect(page.getByLabel('Title')).toHaveValue('Dune');
    await expect(page.getByTestId('mode')).toHaveText('edition');
    await expect(page.getByTestId('app-errors')).toHaveText('');
  });
});
