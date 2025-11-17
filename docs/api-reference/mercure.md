# Mercure API Reference

The Mercure module provides a client for real-time communication with Mercure hubs. It enables subscribing to topics, receiving push updates, and managing connections with automatic reconnection.

## Overview

The Mercure module includes:
- **Mercure Class**: Main client for Mercure communication
- **EventSource**: Custom EventSource implementation
- **Mercure Plugin**: Vue 3 plugin integration
- **Sync Helpers**: Utilities for automatic data synchronization

## Core API

### Mercure Class

Main client class for Mercure communication.

```javascript
import { Mercure } from 'speculoos';

const mercure = new Mercure('https://mercure.example.com/.well-known/mercure', {
  authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  withCredentials: true,
  reconnectInterval: 3000
});
```

**Constructor Parameters:**
- `hub` (String): Mercure hub URL
- `options` (Object, optional): Configuration options
  - `authorization` (String): Authorization token for subscriptions
  - `withCredentials` (Boolean): Include credentials in requests
  - `reconnectInterval` (Number): Reconnection delay in milliseconds

### Connection Management

#### connect()

Establishes connection to Mercure hub.

```javascript
mercure.connect();

// Connection is established when 'open' event is fired
mercure.addListener('open', () => {
  console.log('Connected to Mercure hub');
});
```

#### stop()

Closes the Mercure connection.

```javascript
mercure.stop();

// Connection is closed
mercure.addListener('close', () => {
  console.log('Disconnected from Mercure hub');
});
```

#### listen()

Starts listening for subscribed topics.

```javascript
mercure.subscribe('/books/{id}');
mercure.listen(); // Starts connection if not already connected
```

### Topic Management

#### subscribe(topics?, listen?)

Subscribes to one or more topics.

```javascript
// Subscribe to single topic
mercure.subscribe('/books/1');

// Subscribe to multiple topics
mercure.subscribe(['/books/1', '/books/2', '/authors/1']);

// Subscribe to all updates
mercure.subscribe('*');

// Subscribe without auto-connect
mercure.subscribe('/books/{id}', false);
```

**Parameters:**
- `topics` (String|Array, optional): Topics to subscribe to (default: ['*'])
- `listen` (Boolean, optional): Whether to start listening immediately (default: true)

#### unsubscribe(topics)

Unsubscribes from specific topics.

```javascript
// Unsubscribe from single topic
mercure.unsubscribe('/books/1');

// Unsubscribe from multiple topics
mercure.unsubscribe(['/books/1', '/books/2']);

// Unsubscribe from all topics
mercure.unsubscribe('*');
```

**Parameters:**
- `topics` (String|Array): Topics to unsubscribe from

### Event Handling

#### addListener(callback)

Adds a listener for all Mercure events.

```javascript
const listener = mercure.addListener((event) => {
  const data = JSON.parse(event.data);
  console.log('Received event:', data);
  console.log('Event ID:', event.lastEventId);
});
```

**Parameters:**
- `callback` (Function): Event handler function

**Returns:**
- `Function`: Listener function for removal

#### removeListener(callback)

Removes a specific event listener.

```javascript
mercure.removeListener(listener);
```

**Parameters:**
- `callback` (Function): Listener function to remove

### Reactive Properties

#### subscribedTopics

Reactive array of currently subscribed topics.

```javascript
import { unref } from 'vue';

console.log(unref(mercure.subscribedTopics)); // Current topics

// Watch for changes
mercure.subscribedTopics.value = ['/books/{id}', '/authors/{id}'];
```

#### endpoint

Computed endpoint URL with current topics and last event ID.

```javascript
import { unref } from 'vue';

console.log(unref(mercure.endpoint));
// 'https://mercure.example.com/.well-known/mercure?topic=/books/{id}&topic=/authors/{id}&Last-Event-ID=123'
```

#### lastEventId

Reactive reference to the last received event ID.

```javascript
import { unref } from 'vue';

console.log(unref(mercure.lastEventId)); // Last event ID

// Used for resuming from last known position
```

## Plugin Integration

### createMercure(hub, options?)

Creates a Mercure client with Vue 3 plugin interface.

```javascript
import { createMercure } from 'speculoos';

const mercure = createMercure('https://mercure.example.com/.well-known/mercure', {
  authorization: 'Bearer token',
  reconnectInterval: 5000
});

app.use(mercure);
```

**Parameters:**
- `hub` (String): Mercure hub URL
- `options` (Object, optional): Configuration options

**Returns:**
- `Object`: Mercure instance with `install()` method

### useMercure()

Retrieves Mercure instance from Vue's dependency injection.

```javascript
import { useMercure } from 'speculoos';

const mercure = useMercure();
```

**Returns:**
- `Mercure`: Mercure client instance

## Synchronization Helpers

### mercureSync(mercure, items, topics?, onUpdate?, onDelete?)

Sets up automatic synchronization between Mercure events and reactive data.

```javascript
import { mercureSync } from 'speculoos';

const books = ref([
  { '@id': '/books/1', title: 'Book 1' },
  { '@id': '/books/2', title: 'Book 2' }
]);

const listener = mercureSync(
  mercure,
  books,
  ['/books/{id}'],
  // Update handler
  (update, book) => {
    Object.assign(book, update);
  },
  // Delete handler
  (iri) => {
    const index = books.value.findIndex(book => book['@id'] === iri);
    if (index >= 0) {
      books.value.splice(index, 1);
    }
  }
);
```

**Parameters:**
- `mercure` (Mercure): Mercure client instance
- `items` (Array|Ref): Reactive array of items to sync
- `topics` (Array, optional): Topics to subscribe to (default: ['*'])
- `onUpdate` (Function, optional): Update handler function
- `onDelete` (Function, optional): Delete handler function

**Returns:**
- `Function`: Listener function for cleanup

### on(mercure, topics, callback)

Subscribes to topics with a callback function.

```javascript
import { on } from 'speculoos';

const listener = on(mercure, ['/books/{id}', '/authors/{id}'], (data) => {
  console.log('Received update:', data);
  
  if (data['@type'] === 'Book') {
    handleBookUpdate(data);
  } else if (data['@type'] === 'Author') {
    handleAuthorUpdate(data);
  }
});
```

**Parameters:**
- `mercure` (Mercure): Mercure client instance
- `topics` (Array): Topics to subscribe to
- `callback` (Function): Callback function for received data

**Returns:**
- `Function`: Listener function for cleanup

### useMercureSync(options?)

Composable for Mercure synchronization with automatic cleanup.

```javascript
import { useMercureSync } from 'speculoos';

const { synchronize, on } = useMercureSync({
  removeListenersOnUnmount: true // Auto-cleanup on component unmount
});

const books = ref([]);

// Set up synchronization
const listener = synchronize(
  books,
  ['/books/{id}'],
  (update, book) => Object.assign(book, update)
);

// Set up topic listener
const topicListener = on(['/tasks/{id}'], (data) => {
  console.log('Task updated:', data);
});
```

**Parameters:**
- `options` (Object, optional): Configuration options
  - `removeListenersOnUnmount` (Boolean, default: true): Auto-cleanup on unmount

**Returns:**
- `Object`: Synchronization utilities
  - `synchronize` (Function): Set up item synchronization
  - `on` (Function): Set up topic listener

## EventSource Implementation

### EventSource Class

Custom EventSource implementation with additional features.

```javascript
import { EventSource } from 'speculoos';

const eventSource = new EventSource(url, {
  withCredentials: true,
  headers: {
    'Authorization': 'Bearer token'
  }
});
```

**Constructor Parameters:**
- `url` (String): EventSource URL
- `options` (Object, optional): Configuration options
  - `withCredentials` (Boolean): Include credentials
  - `headers` (Object): Additional headers

## Advanced Usage

### 1. Topic Patterns

Use URI templates for flexible topic matching:

```javascript
// Subscribe to resource patterns
mercure.subscribe('/books/{id}');
mercure.subscribe('/users/{userId}/tasks');
mercure.subscribe('/projects/{projectId}/*');

// Subscribe to multiple patterns
mercure.subscribe([
  '/books/{id}',
  '/authors/{id}',
  '/publishers/{id}'
]);
```

### 2. Conditional Updates

Handle different types of updates:

```javascript
mercureSync(
  mercure,
  items,
  ['/items/{id}'],
  // Custom update logic
  (update, item) => {
    if (update.status === 'deleted') {
      // Handle soft delete
      item.deletedAt = update.deletedAt;
    } else if (update.version > (item.version || 0)) {
      // Handle version conflicts
      if (confirm('Item was modified by another user. Reload?')) {
        Object.assign(item, update);
      }
    } else {
      // Regular update
      Object.assign(item, update);
    }
  },
  // Custom delete logic
  (iri) => {
    const item = items.value.find(item => item['@id'] === iri);
    if (item && !item.deletedAt) {
      item.deletedAt = new Date().toISOString();
      return true; // Don't remove from array
    }
    return false; // Remove from array
  }
);
```

### 3. Connection Monitoring

Monitor connection status and handle errors:

```javascript
import { ref, onUnmounted } from 'vue';

const connectionStatus = ref('disconnected');
const lastError = ref(null);

// Connection status monitoring
mercure.addListener('open', () => {
  connectionStatus.value = 'connected';
  lastError.value = null;
});

mercure.addListener('error', (error) => {
  connectionStatus.value = 'error';
  lastError.value = error;
  
  if (error.type === 'network') {
    console.error('Network error:', error.message);
  } else if (error.type === 'authorization') {
    console.error('Authorization error:', error.message);
    // Redirect to login
    router.push('/login');
  }
});

mercure.addListener('close', () => {
  connectionStatus.value = 'disconnected';
});

// Auto-cleanup
onUnmounted(() => {
  mercure.stop();
});
```

### 4. Batch Processing

Process multiple updates efficiently:

```javascript
const updateQueue = [];
let processingQueue = false;

const processQueue = async () => {
  if (processingQueue || updateQueue.length === 0) return;
  
  processingQueue = true;
  
  try {
    const updates = updateQueue.splice(0, 10); // Process 10 at a time
    await processBatchUpdates(updates);
  } finally {
    processingQueue = false;
    
    // Process more if queue still has items
    if (updateQueue.length > 0) {
      setTimeout(processQueue, 100);
    }
  }
};

mercureSync(
  mercure,
  items,
  ['/items/{id}'],
  (update, item) => {
    updateQueue.push({ update, item });
    processQueue();
  }
);
```

### 5. Selective Synchronization

Synchronize only specific data changes:

```javascript
mercureSync(
  mercure,
  items,
  ['/items/{id}'],
  // Only update specific fields
  (update, item) => {
    const allowedFields = ['title', 'status', 'priority'];
    const filteredUpdate = Object.keys(update)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = update[key];
        return obj;
      }, {});
    
    Object.assign(item, filteredUpdate);
  },
  // Custom delete handling
  (iri) => {
    const item = items.value.find(item => item['@id'] === iri);
    if (item && item.status !== 'deleted') {
      item.status = 'deleted';
      item.deletedAt = new Date().toISOString();
      return true; // Don't remove from array
    }
    return false;
  }
);
```

## Performance Optimization

### 1. Connection Pooling

Reuse connections for multiple subscriptions:

```javascript
class MercurePool {
  constructor() {
    this.connections = new Map();
    this.subscriptions = new Map();
  }
  
  getConnection(hubUrl) {
    if (!this.connections.has(hubUrl)) {
      this.connections.set(hubUrl, new Mercure(hubUrl));
    }
    return this.connections.get(hubUrl);
  }
  
  subscribe(hubUrl, topics, callback) {
    const connection = this.getConnection(hubUrl);
    const key = `${hubUrl}:${topics.join(',')}`;
    
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
    }
    
    this.subscriptions.get(key).add(callback);
    connection.subscribe(topics);
  }
}

const pool = new MercurePool();
pool.subscribe(hubUrl, ['/books/{id}'], handleBookUpdate);
```

### 2. Debounced Updates

Debounce rapid updates to improve performance:

```javascript
import { debounce } from 'lodash-es';

const debouncedUpdate = debounce((update, item) => {
  Object.assign(item, update);
}, 100);

mercureSync(
  mercure,
  items,
  ['/items/{id}'],
  debouncedUpdate
);
```

### 3. Memory Management

Clean up unused listeners and connections:

```javascript
class MercureManager {
  constructor() {
    this.listeners = new Map();
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Cleanup every minute
  }
  
  addListener(key, listener) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(listener);
  }
  
  removeListener(key, listener) {
    const listeners = this.listeners.get(key);
    if (listeners) {
      listeners.delete(listener);
      
      if (listeners.size === 0) {
        this.listeners.delete(key);
      }
    }
  }
  
  cleanup() {
    // Remove unused listeners
    for (const [key, listeners] of this.listeners) {
      if (listeners.size === 0) {
        this.listeners.delete(key);
      }
    }
  }
}
```

## Security Considerations

### 1. JWT Token Management

Securely handle authorization tokens:

```javascript
class SecureMercure {
  constructor(hub, getToken) {
    this.hub = hub;
    this.getToken = getToken;
    this.mercure = null;
    this.refreshInterval = null;
  }
  
  async connect() {
    const token = await this.getToken();
    this.mercure = new Mercure(this.hub, {
      authorization: `Bearer ${token}`
    });
    
    // Set up token refresh
    this.refreshInterval = setInterval(async () => {
      const newToken = await this.getToken();
      if (newToken !== token) {
        this.mercure.stop();
        this.connect();
      }
    }, 300000); // Refresh every 5 minutes
  }
  
  subscribe(topics, callback) {
    if (!this.mercure) {
      await this.connect();
    }
    
    return this.mercure.subscribe(topics);
  }
}

const mercure = new SecureMercure(hubUrl, getAuthToken);
```

### 2. Topic Authorization

Implement topic-based access control:

```javascript
const getAuthorizedTopics = (user) => {
  const topics = [];
  
  // User can access their own resources
  topics.push(`/users/${user.id}/*`);
  
  // User can access team resources
  user.teams.forEach(team => {
    topics.push(`/teams/${team.id}/*`);
  });
  
  // Admin can access all resources
  if (user.role === 'admin') {
    topics.push('*');
  }
  
  return topics;
};

const topics = getAuthorizedTopics(currentUser);
mercure.subscribe(topics);
```

### 3. Data Validation

Validate incoming Mercure data:

```javascript
mercureSync(
  mercure,
  items,
  ['/items/{id}'],
  (update, item) => {
    // Validate data structure
    if (!update['@id'] || !update['@type']) {
      console.error('Invalid Mercure data:', update);
      return;
    }
    
    // Validate permissions
    if (!canAccessResource(update['@id'])) {
      console.warn('Unauthorized access attempt:', update['@id']);
      return;
    }
    
    // Validate data integrity
    if (update.version && update.version <= (item.version || 0)) {
      console.warn('Stale update received:', update);
      return;
    }
    
    Object.assign(item, update);
  }
);
```

## Testing

### 1. Mock Mercure

```javascript
import { Mercure } from 'speculoos';

// Mock Mercure for testing
class MockMercure extends Mercure {
  constructor() {
    super('http://localhost:3000');
    this.mockEvents = [];
  }
  
  connect() {
    // Simulate connection
    setTimeout(() => {
      this.emitter.emit('open', { endpoint: this.hub });
    }, 100);
  }
  
  addMockEvent(data) {
    this.mockEvents.push(data);
    
    // Simulate receiving event
    setTimeout(() => {
      this.emitter.emit('message', {
        data: JSON.stringify(data),
        lastEventId: Date.now().toString()
      });
    }, 50);
  }
}

const mockMercure = new MockMercure();
```

### 2. Event Testing

```javascript
describe('Mercure Sync', () => {
  test('should update items on Mercure events', async () => {
    const items = ref([
      { '@id': '/items/1', title: 'Item 1' }
    ]);
    
    const mockMercure = new MockMercure();
    
    const listener = mercureSync(
      mockMercure,
      items,
      ['/items/{id}']
    );
    
    // Simulate update event
    mockMercure.addMockEvent({
      '@id': '/items/1',
      title: 'Updated Item 1'
    });
    
    // Wait for update
    await nextTick();
    
    expect(items.value[0].title).toBe('Updated Item 1');
  });
});
```

## Best Practices

### 1. Connection Management

- Always handle connection errors gracefully
- Implement automatic reconnection with backoff
- Monitor connection status for UI feedback
- Clean up connections on component unmount

### 2. Topic Subscription

- Subscribe to specific topics rather than wildcard when possible
- Use URI templates for resource patterns
- Unsubscribe from unused topics
- Validate topic authorization

### 3. Data Synchronization

- Use mercureSync() for automatic updates
- Handle update conflicts appropriately
- Implement optimistic updates with rollback
- Batch rapid updates to improve performance

### 4. Performance

- Minimize the number of active subscriptions
- Use debouncing for rapid updates
- Implement proper cleanup to prevent memory leaks
- Monitor connection health and reconnect as needed

## See Also

- [Core Concepts - Mercure](../core-concepts/mercure.md) - Mercure concepts and usage
- [API Reference - Hydra](./hydra.md) - Hydra-Mercure integration
- [Guides - Real-time Updates](../guides/real-time-updates.md) - Practical real-time examples