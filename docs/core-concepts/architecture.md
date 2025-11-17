# Speculoos Architecture

Speculoos is built with a modular, plugin-based architecture that leverages Vue 3's reactivity system and modern JavaScript patterns. This guide explains the overall architecture and design principles that make Speculoos powerful and flexible.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Vue 3 Application                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Store     │  │ API Client  │  │  Mercure    │          │
│  │   Plugin    │  │             │  │   Client    │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│         │               │               │                   │
│         └───────────────┼───────────────┘                   │
│                         │                                   │
│  ┌─────────────────────────────────────────────┐            │
│  │           Hydra Plugin                      │            │
│  │  ┌─────────┐  ┌─────────┐  ┌───────┐        │            │
│  │  │Forms    │  │Endpoints│  │IRI    │        │            │
│  │  │Helper   │  │Manager  │  │Utils  │        │            │
│  │  └─────────┘  └─────────┘  └───────┘        │            │
│  └─────────────────────────────────────────────┘            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Filters   │  │   Pager     │  │   Vulcain   │          │
│  │   Module    │  │   Module    │  │   Module    │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## Core Architectural Principles

### 1. Plugin-Based Design

Speculoos follows a plugin architecture where functionality is added through composable plugins:

```javascript
import { createStore, ApiClient, HydraPlugin, createMercure } from 'speculoos';

// Core store with plugin system
const store = await createStore({
  state: { /* initial state */ },
  methods: { /* store methods */ }
})
  .use(new HydraPlugin(api))     // Add Hydra functionality
  .use(new MercurePlugin());     // Add real-time functionality
```

### 2. Reactive Data Flow

Data flows reactively through the system:

```
API Response → Hydra Plugin → Store State → Vue Components → UI Updates
     ↑                                              ↓
User Actions → Component Events → Store Methods → API Requests
```

### 3. Separation of Concerns

Each module has a specific responsibility:

- **Store**: State management and coordination
- **API Client**: HTTP communication and error handling
- **Hydra Plugin**: Resource management and API integration
- **Mercure**: Real-time communication
- **Filters**: Query string management
- **Pager**: Pagination logic
- **Vulcain**: Request optimization

## Module Architecture

### 1. Store Module

The store is the central coordinator that manages state and plugins:

```javascript
// Store architecture
class Store {
  constructor({ state, methods, name }) {
    this.state = reactive(state);  // Vue 3 reactive state
    this.plugins = [];            // Plugin registry
    this.name = name;            // Store identifier
  }

  // Plugin management
  async use(plugin) {
    this.plugins.push(plugin);
    await plugin.install(this);
    return this;
  }

  // Plugin coordination
  async reconciliate() {
    return Promise.all(
      this.plugins
        .filter(plugin => 'reconciliate' in plugin)
        .map(plugin => plugin.reconciliate(this))
    );
  }
}
```

**Key Features:**
- Reactive state management with Vue 3
- Plugin lifecycle management
- Method binding with state access
- Dependency injection for Vue apps

### 2. API Client Module

The API client provides HTTP communication with Vue 3 integration:

```javascript
// API Client architecture
class ApiClient {
  constructor({ baseUri, options, fetcher }) {
    this.baseUri = baseUri;
    this.options = options;
    this.fetch = fetcher;  // Custom fetch implementation
  }

  // Request lifecycle
  async request(method, url, options) {
    // 1. Merge options
    // 2. Add default headers
    // 3. Handle reactive loading states
    // 4. Manage abort controller
    // 5. Process response
    // 6. Handle errors
  }

  // HTTP methods
  async get(uri, options) { /* ... */ }
  async post(uri, data, options) { /* ... */ }
  async put(uri, data, options) { /* ... */ }
  async delete(uri, options) { /* ... */ }
}
```

**Key Features:**
- Reactive loading state management
- Request deduplication
- Abort controller integration
- Automatic JSON parsing
- Error handling and transformation

### 3. Hydra Plugin Module

The Hydra plugin bridges the store and Hydra APIs:

```javascript
// Hydra Plugin architecture
class HydraPlugin {
  constructor(api, options = {}) {
    this.api = api;
    this.endpoints = new HydraEndpoints(options.endpoints);
    this.classmap = { /* type mappings */ };
    this.errorHandler = options.errorHandler;
  }

  // Resource factory
  factory(item, statusCode) {
    // Create typed instances based on @type
    // Apply reactive wrappers
    // Handle error objects
  }

  // Store integration
  async install(store) {
    // Add methods to store
    store.getItem = (iri, options) => this.getItem(store, iri, options);
    store.createItem = (item, options) => this.createItem(store, item, options);
    // ... other methods
  }
}
```

**Key Features:**
- Type-safe resource management
- Automatic collection handling
- IRI-based operations
- Error object transformation
- Relation resolution

### 4. Mercure Module

The Mercure module provides real-time communication:

```javascript
// Mercure architecture
class Mercure {
  constructor(hub, options = {}) {
    this.hub = hub;
    this.options = reactive(options);
    this.subscribedTopics = ref([]);
    this.emitter = mitt();  // Event emitter
  }

  // Topic management
  subscribe(topics) { /* ... */ }
  unsubscribe(topics) { /* ... */ }

  // Connection management
  connect() { /* ... */ }
  stop() { /* ... */ }

  // Event handling
  addListener(callback) { /* ... */ }
  removeListener(callback) { /* ... */ }
}
```

**Key Features:**
- Topic-based subscriptions
- Automatic reconnection
- Event-driven architecture
- Vue 3 reactive integration

## Data Flow Patterns

### 1. Request Flow

```
Component Action
    ↓
Store Method Call
    ↓
Hydra Plugin → API Client
    ↓
HTTP Request
    ↓
API Response
    ↓
Hydra Plugin (Factory) → Store State Update
    ↓
Vue Reactivity → Component Re-render
```

### 2. Real-time Flow

```
Mercure Event
    ↓
Event Emitter
    ↓
Listener Callback
    ↓
Store State Update
    ↓
Vue Reactivity → Component Re-render
```

### 3. Filter Flow

```
User Input
    ↓
Filter Component
    ↓
Filter Collection (Normalization)
    ↓
Vue Router Query Update
    ↓
API Request with Filters
    ↓
Filtered Response
    ↓
Component Update
```

## Plugin System

### 1. Plugin Interface

All plugins implement a common interface:

```javascript
class BasePlugin {
  constructor(options = {}) {
    this.options = options;
  }

  // Required: Install plugin into store
  async install(store) {
    throw new Error('install() method must be implemented');
  }

  // Optional: Reconcile plugin state
  async reconciliate(store) {
    // Default implementation does nothing
  }

  // Optional: Cleanup resources
  async destroy() {
    // Default implementation does nothing
  }
}
```

### 2. Plugin Lifecycle

1. **Installation**: Plugin is installed into store
2. **Configuration**: Plugin configures store methods
3. **Runtime**: Plugin handles operations during app lifecycle
4. **Reconciliation**: Plugin syncs state when needed
5. **Destruction**: Plugin cleans up resources

### 3. Plugin Communication

Plugins can communicate through the store:

```javascript
class PluginA {
  async install(store) {
    store.pluginA = {
      doSomething: () => console.log('Plugin A action')
    };
  }
}

class PluginB {
  async install(store) {
    // Access other plugin methods
    store.pluginA?.doSomething();
  }
}
```

## Performance Architecture

### 1. Request Optimization

- **Deduplication**: Prevent duplicate requests
- **Caching**: Store responses in memory
- **Vulcain Integration**: Request only needed data
- **Lazy Loading**: Load data on demand

### 2. Reactivity Optimization

- **Shallow Reactivity**: Use for large datasets
- **Computed Properties**: Cache expensive calculations
- **Debounced Updates**: Batch rapid changes
- **Selective Watching**: Watch specific properties

### 3. Memory Management

- **Weak References**: Avoid memory leaks
- **Cleanup Functions**: Remove listeners on unmount
- **Garbage Collection**: Clear unused cache entries
- **Resource Pooling**: Reuse expensive objects

## Error Handling Architecture

### 1. Hierarchical Error Handling

```
API Error → HttpError → Hydra Plugin → Store → Component
     ↓              ↓              ↓           ↓
Error Transform → Error Factory → Error Handler → UI Update
```

### 2. Error Types

```javascript
// HTTP errors
class HttpError extends Error {
  constructor(response) {
    super(response.statusText);
    this.response = response;
    this.statusCode = response.status;
  }
}

// Hydra errors
class HydraError extends Error {
  constructor(data) {
    super(data['hydra:description']);
    this.data = data;
    this.type = data['@type'];
  }
}

// Validation errors
class ConstraintViolationList extends Error {
  constructor(violations) {
    super('Validation failed');
    this.violations = violations;
  }
}
```

### 3. Error Recovery

- **Automatic Retry**: For network errors
- **Fallback Data**: For failed requests
- **User Notifications**: For validation errors
- **Graceful Degradation**: For missing features

## Security Architecture

### 1. Authentication Flow

```
Login Request → JWT Token → Store Token → API Headers
     ↓              ↓            ↓           ↓
Token Refresh → New Token → Update Store → New Headers
```

### 2. Authorization

- **JWT Validation**: Verify token authenticity
- **Role-based Access**: Check user permissions
- **Resource Scoping**: Filter data by access rights
- **Mercure Authorization**: Secure topic subscriptions

### 3. Data Validation

- **Input Sanitization**: Clean user input
- **Schema Validation**: Validate against API schemas
- **Type Checking**: Ensure data consistency
- **XSS Prevention**: Escape dangerous content

## Testing Architecture

### 1. Unit Testing

```javascript
// Mock dependencies
const mockApi = {
  get: jest.fn(),
  post: jest.fn()
};

const mockStore = createStore({
  state: {},
  methods: {}
});

// Test plugin in isolation
const plugin = new HydraPlugin(mockApi);
await plugin.install(mockStore);

expect(mockStore.getItem).toBeDefined();
```

### 2. Integration Testing

```javascript
// Test full data flow
const store = await createStore()
  .use(new HydraPlugin(api))
  .use(new MercurePlugin());

const book = await store.createItem({
  title: 'Test Book',
  author: '/authors/1'
});

expect(book['@id']).toBeDefined();
expect(store.state.items).toContain(book);
```

### 3. End-to-End Testing

```javascript
// Test complete user workflows
test('user can create and edit book', async () => {
  // 1. Load form
  await renderComponent(BookForm);

  // 2. Fill form
  await fillForm({
    title: 'New Book',
    author: 'Author Name'
  });

  // 3. Submit form
  await clickButton('Create Book');

  // 4. Verify result
  expect(screen.getByText('Book created')).toBeInTheDocument();
});
```

## Extensibility Architecture

### 1. Custom Plugins

Create plugins to add functionality:

```javascript
class CachePlugin {
  constructor(ttl = 300000) { // 5 minutes
    this.cache = new Map();
    this.ttl = ttl;
  }

  async install(store) {
    // Wrap API methods with caching
    const originalGet = store.getItem;
    store.getItem = async (iri, options) => {
      const cached = this.get(iri);
      if (cached) return cached;

      const result = await originalGet.call(store, iri, options);
      this.set(iri, result);
      return result;
    };
  }

  get(key) { /* cache logic */ }
  set(key, value) { /* cache logic */ }
}
```

### 2. Custom Factories

Extend Hydra type system:

```javascript
class Book {
  constructor(data) {
    Object.assign(this, data);
  }

  get displayTitle() {
    return this.title.toUpperCase();
  }

  publish() {
    this.status = 'published';
  }
}

// Register custom factory
const plugin = new HydraPlugin(api, {
  classmap: {
    'Book': Book
  }
});
```

### 3. Custom Filters

Create specialized filters:

```javascript
class AutocompleteFilter extends Filter {
  constructor(property, minChars = 2) {
    super(property);
    this.minChars = minChars;
  }

  normalize() {
    const value = this.value;
    if (value.length < this.minChars) return null;
    return { [this.property]: value };
  }

  async denormalize(value) {
    this.value = value;
    if (value.length >= this.minChars) {
      this.suggestions = await this.fetchSuggestions(value);
    }
  }
}
```

## Best Practices

### 1. Module Design

- **Single Responsibility**: Each module has one clear purpose
- **Loose Coupling**: Modules interact through interfaces
- **High Cohesion**: Related functionality is grouped
- **Dependency Injection**: Avoid hard dependencies

### 2. Performance

- **Lazy Loading**: Load code and data on demand
- **Memoization**: Cache expensive computations
- **Batching**: Group operations together
- **Optimistic Updates**: Update UI before server confirmation

### 3. Maintainability

- **Type Safety**: Use TypeScript for better tooling
- **Documentation**: Document all public APIs
- **Testing**: Comprehensive test coverage
- **Error Handling**: Graceful error management

## Next Steps

To understand specific modules in detail:

- [API Reference - Store](../api-reference/store.md) - Store architecture
- [API Reference - Hydra](../api-reference/hydra.md) - Hydra plugin details
- [API Reference - API Client](../api-reference/api-client.md) - HTTP client architecture

For more architectural patterns:

- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Plugin Architecture Patterns](https://addyosmani.com/resources/essentialjsdesignpatterns/book/#pluginpattern)
- [Reactive Programming](https://en.wikipedia.org/wiki/Reactive_programming)
