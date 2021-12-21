# Api Client

A lightweight API Client built on top of the [fetch](https://developer.mozilla.org/docs/Web/API/Fetch_API) API.

## Usage

```javascript
import { ApiClient } from 'speculoos';

const item = {foo: 'bar'};
const client = new ApiClient({baseUri: 'https://example.com', options});
const response = await client.post('/api/foos', item); // item will be json encoded
const data = response.data; // already awaited response.json();
```

Available methods are `get()`, `post()`, `put()`, `delete()`
and return [Response](https://developer.mozilla.org/docs/Web/API/Response) objects.

### Client options

```javascript
import { ApiClient } from 'speculoos';
import { computed, reactive, ref, unref } from 'vue';

const token = ref();
const headers = computed(() => {
  if (null == unref(token)) {
    return {};
  }
  return {Authorization: `Bearer ${unref(token)}`}; // Will unref the token at request time
});
const options = reactive({headers});
const client = new ApiClient({baseUri: 'https://example.com', options});
```


### Request options

```javascript
import { ApiClient } from 'speculoos';

const client = new ApiClient({baseUri: 'https://example.com'});
await client.get('/api/foos', {credentials: 'include'}); // request options are merged with client options.
```

#### Loading state

While the request is being processed, you can pass a `ref` that will evaluate to `true`
just before the request is sent, and to `false` once it completes, using the `isLoading` option:

```javascript
import { ref } from 'vue';
const isLoading = ref(false);
await client.get('/api/foos', {isLoading});
```

#### Additional headers

You can add per-request headers (for example Vulcain headers):

```javascript
import { vulcain } from 'speculoos';

await client.get('/api/foos', {
    headers: {
        'X-Foo': 'Bar',
        ...vulcain({fields: ['id', 'name']}),
    }
});
```

## HTTP Errors

400x / 500x status codes are thrown as errors.

```javascript
import { ApiClient } from 'speculoos';

const client = new ApiClient({baseUri: 'https://example.com'});
let response;
try {
    response = await client.get('/api/foos');
} catch (e) {
    response = e.response;
    console.log(e.getStatusCode());
}
```

## Prevent duplicate requests

Several identical pending requests can point to the same _Promise_ with this little helper:

```javascript
import { ApiClient, withoutDuplicates } from 'speculoos/api-client';

const client = new ApiClient({baseUri: 'https://example.com', fetcher: withoutDuplicates()});
```
