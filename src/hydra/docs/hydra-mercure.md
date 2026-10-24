# Mercure Synchronization

Hydra items can be synced with Mercure updates.

## Items synchronization

### Component (composition) context

```vue
<script setup>
import { useMercureSync, useStore } from 'speculoos';

const {synchronize} = useMercureSync();
const store = useStore();

const item = await store.getItem('/api/foos/1');
synchronize(item); // Item will be populated through Mercure updates
</script>
```

The listeners added by `useMercureSync()` are removed when the component is unmounted, or when the
effect scope it runs in is disposed. Pass `{removeListenersOnUnmount: false}` as its second argument
to keep them.

The topics stay subscribed: they are shared by every listener of the Mercure instance. Call
`mercure.unsubscribe(topics)` once nothing listens to them anymore.

### Other

```js
import { mercureSync } from 'speculoos';

// mercure is a Mercure instance
mercureSync(mercure, item);
```

## Topic reactivity

When something occurs on a specific topic, a callback can be triggered.

```vue
<script setup>
import { useMercureSync, useStore } from 'speculoos';

const {on} = useMercureSync();
on('/api/foos/{id}', () => refresh());
</script>
```
