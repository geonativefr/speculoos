# Mercure

An opinionated Mercure client.

## Usage

### Connect anonymously

```js
import { Mercure } from 'speculoos';

const mercure = new Mercure('https://example.org/.well-known/mercure');
```

### Authentication

#### Cookie-based

```js
const mercure = new Mercure('https://example.org/.well-known/mercure', {withCredentials: true});
```

#### Token-based

```js
const token = computed(() => store.state.accessToken);
const mercure = new Mercure('https://example.org/.well-known/mercure', {
  headers: {
    Authorization: computed(() => `Bearer ${token}`),
  },
});
```

### Subscribe to topics

```js
const handleUpdate = ({id, data}) => { /* ... */ }
mercure.addListener(handleUpdate)
mercure.subscribe(['/foos', '/bars']); // To subscribe to specific topics
mercure.subscribe(); // Otherwise
```

## Item synchronization

See [Mercure Synchronization](../hydra/docs/hydra-mercure.md).
