import { AbortError, ApiClient, withoutDuplicates } from '../index.js';
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

it('reads the response body once when duplicates are prevented', async () => {
  const text = jest.fn(async () => JSON.stringify({foo: 'bar'}));
  const client = new ApiClient({
    baseUri: 'https://example.com/',
    fetcher: withoutDuplicates(async () => ({status: 200, text})),
  });
  const {data} = await client.get('/api/foo');
  expect(data).toEqual({foo: 'bar'});
  expect(text).toHaveBeenCalledTimes(1);
});

// Like the native Headers, keeps its entries out of its own enumerable properties
class NativeLikeHeaders extends Headers {
  constructor(init = {}) {
    super();
    Object.defineProperty(this, 'entries', {value: {...init}});
  }

  keys() {
    return Object.keys(this.entries);
  }

  get(key) {
    return this.entries[key] ?? null;
  }
}

const createDuplicatesFetcher = () => {
  const fetcher = jest.fn(async () => ({status: 200, text: async () => '{}'}));
  return [withoutDuplicates(fetcher), fetcher];
};

it('shares a pending request with an identical one', async () => {
  const [fetch, fetcher] = createDuplicatesFetcher();
  const isLoading = ref(false);
  watch(isLoading, () => {});
  await Promise.all([
    fetch('https://example.com/api/foo', {method: 'GET', headers: new NativeLikeHeaders({Accept: 'application/json'}), isLoading}),
    fetch('https://example.com/api/foo', {method: 'GET', headers: new NativeLikeHeaders({accept: 'application/json'}), isLoading}),
  ]);
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it('does not share a pending request with one that has other headers', async () => {
  const [fetch, fetcher] = createDuplicatesFetcher();
  await Promise.all([
    fetch('https://example.com/api/foo', {method: 'GET', headers: new NativeLikeHeaders({'Accept-Language': 'fr'})}),
    fetch('https://example.com/api/foo', {method: 'GET', headers: new NativeLikeHeaders({'Accept-Language': 'en'})}),
  ]);
  expect(fetcher).toHaveBeenCalledTimes(2);
});

it('does not share a pending request with one that has another method or body', async () => {
  const [fetch, fetcher] = createDuplicatesFetcher();
  await Promise.all([
    fetch('https://example.com/api/foo', {method: 'GET'}),
    fetch('https://example.com/api/foo', {method: 'DELETE'}),
    fetch('https://example.com/api/foo', {method: 'PUT', body: '{"foo":"foo"}'}),
    fetch('https://example.com/api/foo', {method: 'PUT', body: '{"foo":"bar"}'}),
  ]);
  expect(fetcher).toHaveBeenCalledTimes(4);
});

it('does not share a pending request with one that has other credentials, mode, cache or redirect', async () => {
  const [fetch, fetcher] = createDuplicatesFetcher();
  await Promise.all([
    fetch('https://example.com/api/foo', {method: 'GET', credentials: 'include'}),
    fetch('https://example.com/api/foo', {method: 'GET', credentials: 'omit'}),
    fetch('https://example.com/api/foo', {method: 'GET', mode: 'no-cors'}),
    fetch('https://example.com/api/foo', {method: 'GET', cache: 'no-store'}),
    fetch('https://example.com/api/foo', {method: 'GET', redirect: 'manual'}),
  ]);
  expect(fetcher).toHaveBeenCalledTimes(5);
});

it('does not share a request that carries a signal', async () => {
  const [fetch, fetcher] = createDuplicatesFetcher();
  await Promise.all([
    fetch('https://example.com/api/foo', {method: 'GET', signal: new AbortController().signal}),
    fetch('https://example.com/api/foo', {method: 'GET', signal: new AbortController().signal}),
  ]);
  expect(fetcher).toHaveBeenCalledTimes(2);
});

it('does not share a request whose body cannot be compared', async () => {
  const [fetch, fetcher] = createDuplicatesFetcher();
  const body = (value) => {
    const formData = new FormData();
    formData.append('foo', value);
    return formData;
  };
  await Promise.all([
    fetch('https://example.com/api/foo', {method: 'POST', body: body('foo')}),
    fetch('https://example.com/api/foo', {method: 'POST', body: body('bar')}),
  ]);
  expect(fetcher).toHaveBeenCalledTimes(2);
});
