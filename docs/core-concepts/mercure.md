# Understanding Mercure

Mercure is a protocol for real-time data updates that enables servers to push updates to web clients in a secure, efficient, and standardized way. Speculoos provides seamless integration with Mercure for building real-time applications.

## What is Mercure?

Mercure is an open protocol built on top of Server-Sent Events (SSE) that provides:

- **Real-time updates** - Instant data synchronization between server and clients
- **Secure communication** - JWT-based authentication and authorization
- **Topic-based subscriptions** - Clients subscribe to specific data topics
- **Automatic reconnection** - Built-in handling of connection drops
- **Scalable architecture** - Supports multiple subscribers and load balancing

## Core Concepts

### 1. Topics

Topics are the foundation of Mercure's publish-subscribe model:

```javascript
// Subscribe to all updates
mercure.subscribe('*');

// Subscribe to specific resource
mercure.subscribe('/books/1');

// Subscribe to resource patterns
mercure.subscribe('/books/{id}');
mercure.subscribe('/users/{userId}/tasks');
```

### 2. Events

Events are pushed from the server to subscribed clients:

```json
{
  "id": "event-123",
  "data": {
    "@id": "/books/1",
    "@type": "Book",
    "title": "Updated Title",
    "status": "published"
  },
  "retry": 3000
}
```

### 3. JWT Tokens

Mercure uses JWT tokens for authentication and authorization:

```javascript
// Subscribe token (what topics can be accessed)
const subscribeToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...';

// Publish token (who can publish updates)
const publishToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...';
```

## How Speculoos Uses Mercure

### 1. Basic Setup

Create a Mercure client in Speculoos:

```javascript
import { createMercure } from 'speculoos';

const mercure = createMercure('https://mercure.example.com/.well-known/mercure', {
  // JWT token for subscriptions
  authorization: 'Bearer your-jwt-token',
  
  // Reconnection options
  reconnectInterval: 3000,
  
  // EventSource options
  withCredentials: true
});

// Install in Vue app
app.use(mercure);
```

### 2. Subscribing to Updates

Subscribe to real-time updates:

```javascript
import { useMercure } from 'speculoos';

const mercure = useMercure();

// Subscribe to all book updates
mercure.subscribe('/books/{id}');

// Listen for updates
mercure.addListener((event) => {
  const data = JSON.parse(event.data);
  console.log('Book updated:', data);
});
```

### 3. Automatic Synchronization

Use the built-in synchronization helpers:

```javascript
import { useMercureSync } from 'speculoos';

const mercureSync = useMercureSync();

// Synchronize reactive array with Mercure updates
const books = ref([]);

const listener = mercureSync.synchronize(
  books, // Reactive array to sync
  ['/books/{id}'], // Topics to subscribe to
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

## Advanced Usage

### 1. Topic Patterns

Use URI templates for flexible topic matching:

```javascript
// Subscribe to user-specific tasks
mercure.subscribe('/users/{userId}/tasks');

// Subscribe to project resources
mercure.subscribe('/projects/{projectId}/*');

// Listen for specific topic patterns
mercure.on(['/books/{id}', '/authors/{id}'], (data) => {
  console.log('Book or author updated:', data);
});
```

### 2. Conditional Updates

Handle different types of updates:

```javascript
mercureSync.synchronize(
  tasks,
  ['/tasks/{id}'],
  // Custom update logic
  (update, task) => {
    if (update.status === 'deleted') {
      // Handle soft delete
      task.deletedAt = new Date().toISOString();
    } else {
      // Regular update
      Object.assign(task, update);
    }
  },
  // Custom delete logic
  (iri) => {
    const task = tasks.value.find(t => t['@id'] === iri);
    if (task) {
      task.status = 'deleted';
      return true; // Don't remove from array
    }
    return false; // Remove from array
  }
);
```

### 3. Event Filtering

Filter events based on content:

```javascript
mercure.on(['/tasks/{id}'], (data) => {
  // Only process tasks assigned to current user
  if (data.assignee === currentUser.value['@id']) {
    updateTaskInUI(data);
  }
});
```

### 4. Connection Management

Monitor connection status:

```javascript
import { onUnmounted } from 'vue';

const setupMercure = () => {
  // Connection opened
  mercure.addListener('open', () => {
    console.log('Connected to Mercure');
  });
  
  // Connection error
  mercure.addListener('error', (error) => {
    console.error('Mercure connection error:', error);
  });
  
  // Clean up on component unmount
  onUnmounted(() => {
    mercure.stop();
  });
};
```

## Integration with Hydra

### 1. Automatic Resource Syncing

Combine Mercure with Hydra for seamless real-time updates:

```javascript
import { useStore, useMercureSync } from 'speculoos';

const store = useStore();
const mercureSync = useMercureSync();

// Load initial data
const books = ref([]);
const loadBooks = async () => {
  const collection = await store.fetchCollection('/books');
  books.value = collection['hydra:member'];
  
  // Set up real-time sync for loaded books
  mercureSync.synchronize(books, ['/books/{id}']);
};

// Create new book with real-time feedback
const createBook = async (bookData) => {
  const book = await store.createItem(bookData);
  // Mercure will automatically sync the new book to all subscribers
  return book;
};
```

### 2. Optimistic Updates

Implement optimistic updates with rollback:

```javascript
const updateBook = async (book, updates) => {
  // Store original state for rollback
  const originalState = { ...book };
  
  try {
    // Optimistic update
    Object.assign(book, updates);
    
    // Server update
    await store.updateItem(book);
    
    // Mercure will sync to other clients
  } catch (error) {
    // Rollback on error
    Object.assign(book, originalState);
    throw error;
  }
};
```

### 3. Conflict Resolution

Handle concurrent updates:

```javascript
mercureSync.synchronize(
  books,
  ['/books/{id}'],
  (update, book) => {
    // Check if local changes exist
    if (book.isDirty) {
      // Show conflict resolution dialog
      showConflictDialog(book, update);
    } else {
      // Apply update directly
      Object.assign(book, update);
    }
  }
);
```

## Performance Optimization

### 1. Selective Subscriptions

Subscribe only to necessary topics:

```javascript
// Bad: Subscribe to everything
mercure.subscribe('*');

// Good: Subscribe to specific resources
mercure.subscribe('/projects/{projectId}/tasks');

// Better: Subscribe based on user permissions
const userTopics = getUserTopics(currentUser.value);
userTopics.forEach(topic => mercure.subscribe(topic));
```

### 2. Debounce Updates

Debounce rapid updates to improve performance:

```javascript
import { debounce } from 'lodash-es';

const debouncedUpdate = debounce((update, item) => {
  Object.assign(item, update);
}, 100);

mercureSync.synchronize(
  items,
  ['/items/{id}'],
  debouncedUpdate
);
```

### 3. Batch Processing

Batch multiple updates:

```javascript
const updateQueue = [];
let processingQueue = false;

const processQueue = async () => {
  if (processingQueue) return;
  processingQueue = true;
  
  while (updateQueue.length > 0) {
    const updates = updateQueue.splice(0, 10); // Process 10 at a time
    await processBatchUpdates(updates);
  }
  
  processingQueue = false;
};

mercure.on(['/items/{id}'], (data) => {
  updateQueue.push(data);
  processQueue();
});
```

## Security Considerations

### 1. JWT Token Management

Securely handle JWT tokens:

```javascript
// Store tokens securely
const getMercureToken = () => {
  return localStorage.getItem('mercure_token');
};

// Refresh tokens periodically
const refreshToken = async () => {
  const response = await fetch('/api/mercure-token');
  const { token } = await response.json();
  localStorage.setItem('mercure_token', token);
  return token;
};

// Create Mercure with token refresh
const mercure = createMercure(hubUrl, {
  authorization: `Bearer ${getMercureToken()}`,
  // Implement token refresh logic
  onTokenExpired: refreshToken
});
```

### 2. Topic Authorization

Implement proper topic-based authorization:

```javascript
// Server-side JWT claims
{
  "mercure": {
    "subscribe": [
      "/books/{id}",
      "/users/{userId}/tasks"
    ],
    "publish": [
      "/books/{id}",
      "/tasks/{id}"
    ]
  }
}

// Client-side subscription validation
const canSubscribe = (topic) => {
  const userTopics = getUserTopics(currentUser.value);
  return userTopics.some(userTopic => 
    topic.startsWith(userTopic.replace('{id}', ''))
  );
};
```

### 3. Data Validation

Validate incoming data:

```javascript
mercure.on(['/books/{id}'], (data) => {
  // Validate data structure
  if (!data['@id'] || !data['@type']) {
    console.error('Invalid book data:', data);
    return;
  }
  
  // Validate permissions
  if (!canAccessBook(data['@id'])) {
    console.warn('Unauthorized access to book:', data['@id']);
    return;
  }
  
  // Process valid data
  updateBookInUI(data);
});
```

## Debugging

### 1. Connection Monitoring

Monitor Mercure connection status:

```javascript
const connectionStatus = ref('disconnected');

mercure.addListener('open', () => {
  connectionStatus.value = 'connected';
});

mercure.addListener('error', (error) => {
  connectionStatus.value = 'error';
  console.error('Mercure error:', error);
});

mercure.addListener('close', () => {
  connectionStatus.value = 'disconnected';
});
```

### 2. Event Logging

Log all Mercure events for debugging:

```javascript
mercure.addListener((event) => {
  console.log('Mercure event:', {
    id: event.lastEventId,
    data: JSON.parse(event.data),
    timestamp: new Date().toISOString()
  });
});
```

### 3. Subscription Tracking

Track active subscriptions:

```javascript
const activeSubscriptions = ref([]);

const subscribeWithTracking = (topics) => {
  mercure.subscribe(topics);
  activeSubscriptions.value.push(...topics);
};

const unsubscribeWithTracking = (topics) => {
  mercure.unsubscribe(topics);
  activeSubscriptions.value = activeSubscriptions.value.filter(
    topic => !topics.includes(topic)
  );
};
```

## Best Practices

### 1. Component Lifecycle

Manage Mercure subscriptions within component lifecycle:

```vue
<script setup>
import { onMounted, onUnmounted } from 'vue';
import { useMercureSync } from 'speculoos';

const items = ref([]);
const mercureSync = useMercureSync();

let listener = null;

onMounted(async () => {
  await loadItems();
  
  listener = mercureSync.synchronize(
    items,
    ['/items/{id}'],
    handleUpdate,
    handleDelete
  );
});

onUnmounted(() => {
  if (listener) {
    mercureSync.removeListener(listener);
  }
});
</script>
```

### 2. Error Handling

Implement robust error handling:

```javascript
const setupMercure = () => {
  mercure.addListener('error', (error) => {
    if (error.type === 'network') {
      // Handle network errors
      showNetworkError();
    } else if (error.type === 'authorization') {
      // Handle auth errors
      redirectToLogin();
    } else {
      // Handle other errors
      showGenericError(error);
    }
  });
};
```

### 3. Performance Monitoring

Monitor Mercure performance:

```javascript
const metrics = {
  eventsReceived: 0,
  updatesProcessed: 0,
  averageProcessingTime: 0
};

mercure.addListener((event) => {
  const startTime = performance.now();
  
  // Process event
  processEvent(event);
  
  const endTime = performance.now();
  metrics.eventsReceived++;
  metrics.updatesProcessed++;
  metrics.averageProcessingTime = 
    (metrics.averageProcessingTime + (endTime - startTime)) / 2;
});
```

## Next Steps

To learn more about using Mercure in Speculoos:

- [API Reference - Mercure](../api-reference/mercure.md) - Detailed API documentation
- [Guides - Real-time Updates](../guides/real-time-updates.md) - Practical real-time examples
- [Core Concepts - Vue 3 Reactivity](./vue3-reactivity.md) - Understanding reactivity patterns

For more information about Mercure itself:

- [Mercure Documentation](https://mercure.rocks/)
- [Mercure Hub](https://github.com/dunglas/mercure)
- [Server-Sent Events Specification](https://html.spec.whatwg.org/multipage/server-sent-events.html)