import { AbortError, ApiClient } from '../index.js';
import { HttpError } from '../errors/HttpError.js';
import { fetch } from './setup.js';
import { ref, watch } from 'vue';

const client = new ApiClient({baseUri: 'https://example.com/', fetcher: fetch});

it('resolves URIs', () => {
  expect(client.resolve('/api/foo')).toBe('https://example.com/api/foo');
});

it('performs GET requests', async () => {
  const item = {foo: 'bar'};
  const {data, request} = await client.get('/api/foo', {response: {body: JSON.stringify(item)}});
  expect(data).toEqual(item);
  expect(request.url).toBe('https://example.com/api/foo');
  expect(request.options.method).toBe('GET');
});

it('performs POST requests', async () => {
  const item = {foo: 'bar'};
  const {data, request} = await client.post('/api/foos', item, {response: {body: JSON.stringify(item)}});
  expect(data).toEqual(item);
  expect(request.url).toBe('https://example.com/api/foos');
  expect(request.options.method).toBe('POST');
  expect(request.options.body).toBe(JSON.stringify(item));
  expect(request.options.headers['Accept']).toBe('application/ld+json, application/json');
  expect(request.options.headers['Content-Type']).toBe('application/json');
});

it('performs PUT requests', async () => {
  const item = {foo: 'bar'};
  const {data, request} = await client.put('/api/foo', item, {response: {body: JSON.stringify(item)}});
  expect(data).toEqual(item);
  expect(request.url).toBe('https://example.com/api/foo');
  expect(request.options.method).toBe('PUT');
  expect(request.options.body).toBe(JSON.stringify(item));
  expect(request.options.headers['Accept']).toBe('application/ld+json, application/json');
  expect(request.options.headers['Content-Type']).toBe('application/json');
});

it('performs DELETE requests', async () => {
  const item = {foo: 'bar'};
  const {data, request} = await client.delete('/api/foo', {response: {body: JSON.stringify(item)}});
  expect(data).toEqual(item);
  expect(request.url).toBe('https://example.com/api/foo');
  expect(request.options.method).toBe('DELETE');
});

it('throws HttpErrors', async () => {
  const response = {status: 404, statusText: 'Not found', body: 'Item Not found'};
  try {
    await client.get('/api/foo', {response});
    expect(true).toBeFalsy(); // Should not be reached
  } catch (e) {
    expect(e).toBeInstanceOf(HttpError);
    expect(e.statusCode).toBe(404);
    expect(e.response.statusText).toEqual(response.statusText);
    expect(e.response.body).toEqual(response.body);
  }
});

it('notifies that it is loading', async () => {
  const isLoading = ref();
  const loadingNotifications = [];
  watch(isLoading, (value) => loadingNotifications.push(value));
  await client.get('/api/foo', {response: {}, isLoading});
  expect(isLoading.value).toBe(false);
  expect(loadingNotifications).toEqual([true, false]);
});

it('cancels a request', async () => {
  let error;
  const aborted = ref(false);
  const options = {
    response: () => {
      aborted.value = true;
      return {};
    },
    aborted,
  };
  try {
    const response = await client.get('/api/foo', options);
  } catch (e) {
    error = e;
  }
  expect(error).toBeInstanceOf(AbortError);
});
