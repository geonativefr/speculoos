import { AbortError, ApiClient } from '../index.js';
import { HttpError } from '../errors/HttpError.js';
import { fetch } from './setup.js';
import { computed, nextTick, reactive, ref, watch } from 'vue';

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

it('keeps the client\'s headers when a request has its own', async () => {
  const locale = ref('fr');
  const client = new ApiClient({
    baseUri: 'https://example.com/',
    fetcher: fetch,
    options: reactive({
      headers: {
        'Accept-Language': computed(() => locale.value),
        Authorization: 'Bearer token',
      },
    }),
  });
  const item = {foo: 'bar'};
  const response = {body: JSON.stringify(item)};

  let {request} = await client.post('/api/foos', item, {response, headers: {'X-Foo': 'foo'}});
  expect(request.options.headers['Accept']).toBe('application/ld+json, application/json');
  expect(request.options.headers['Accept-Language']).toBe('fr');
  expect(request.options.headers['Authorization']).toBe('Bearer token');
  expect(request.options.headers['Content-Type']).toBe('application/json');
  expect(request.options.headers['X-Foo']).toBe('foo');

  locale.value = 'en';
  ({request} = await client.put('/api/foos/1', item, {response}));
  expect(request.options.headers['Accept-Language']).toBe('en');
  expect(request.options.headers['Authorization']).toBe('Bearer token');
  expect(request.options.headers['Content-Type']).toBe('application/json');

  ({request} = await client.get('/api/foos/1', {response, headers: {Preload: '/foo'}}));
  expect(request.options.headers['Accept-Language']).toBe('en');
  expect(request.options.headers['Authorization']).toBe('Bearer token');
  expect(request.options.headers['Preload']).toBe('/foo');
});

it('lets a request\'s header replace the client\'s header of the same name, whatever its case', async () => {
  const client = new ApiClient({
    baseUri: 'https://example.com/',
    fetcher: fetch,
    options: {headers: new Headers({'accept-language': 'fr', authorization: 'Bearer token'})},
  });
  const {request} = await client.post('/api/foos', {}, {
    response: {body: '{}'},
    headers: {'Accept-Language': 'en', 'content-type': 'application/merge-patch+json'},
  });
  expect(request.options.headers.keys().sort()).toEqual(['Accept', 'Accept-Language', 'authorization', 'content-type']);
  expect(request.options.headers['Accept-Language']).toBe('en');
  expect(request.options.headers['authorization']).toBe('Bearer token');
  expect(request.options.headers['content-type']).toBe('application/merge-patch+json');
});

it('stops watching the aborted ref once a request is over', async () => {
  const aborted = ref(false);
  const {request} = await client.get('/api/foo', {response: {}, aborted});
  expect(request.options.signal.aborted).toBe(false);

  aborted.value = true;
  await nextTick();
  expect(request.options.signal.aborted).toBe(false);
});
