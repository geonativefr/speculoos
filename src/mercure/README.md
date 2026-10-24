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

The options are passed to the browser's `EventSource`, which only supports `withCredentials`: it
cannot send headers, so a `headers` option is ignored. To authorize a subscriber with a token, have
the server set it in the `mercureAuthorization` cookie, and connect with `withCredentials: true`.

### Subscribe to topics

```js
const handleUpdate = ({id, data}) => { /* ... */ }
mercure.addListener(handleUpdate)
mercure.subscribe(['/foos', '/bars']); // To subscribe to specific topics
mercure.subscribe(); // Otherwise
```

## Item synchronization

See [Mercure Synchronization](../hydra/docs/hydra-mercure.md).
