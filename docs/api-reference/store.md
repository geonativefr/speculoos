# Store API Reference

The Store module provides a lightweight, extensible global state management system with a plugin architecture. It's built around Vue 3's reactivity system and serves as the central coordinator for all Speculoos functionality.

## Overview

The Store is the heart of Speculoos, managing:
- Reactive state management
- Plugin lifecycle and coordination
- Method binding with state access
- Dependency injection for Vue applications

## Core API

### createStore()

Creates a new store instance with optional state and methods.

```javascript
import { createStore } from 'speculoos';

const store = await createStore({
  state: {
    user: null,
    items: [],
    loading: false
  },
  methods: {
    setUser(state, user) {
      state.user = user;
    },
    setLoading(state, loading) {
      state.loading = loading;
    }
  },
  name: 'myStore' // Optional store name
});
```

**Parameters:**
- `config` (Object): Configuration object
  - `state` (Object, optional): Initial reactive state
  - `methods` (Object, optional): Store methods with state access
  - `name` (String, optional): Store identifier for dependency injection

**Returns:**
- `Promise<Store>`: Store instance with installed plugins

### useStore()

Retrieves a store instance from Vue's dependency injection system.

```javascript
import { useStore } from 'speculoos';

// Get default store
const store = useStore();

// Get named store
const namedStore = useStore('myStore');
```

**Parameters:**
- `name` (String, optional): Store name to retrieve (defaults to 'store')

**Returns:**
- `Store`: Store instance

## Store Instance API

### Properties

#### state

Reactive state object containing all application data.

```javascript
console.log(store.state.user); // Access state
store.state.loading = true; // Update state (triggers reactivity)
```

#### name

Store identifier used for dependency injection.

```javascript
console.log(store.name); // 'store' (or custom name)
```

### Methods

#### use(plugin)

Install a plugin into the store.

```javascript
import { HydraPlugin, createMercure } from 'speculoos';

await store.use(new HydraPlugin(api));
await store.use(createMercure(hubUrl));
```

**Parameters:**
- `plugin` (Object): Plugin instance with `install()` method

**Returns:**
- `Promise<Store>`: Store instance for chaining

#### reconciliate(sequentially?)

Reconcile all plugins that implement a `reconciliate()` method.

```javascript
// Reconcile all plugins in parallel
await store.reconciliate();

// Reconcile plugins sequentially
await store.reconciliate(true);
```

**Parameters:**
- `sequentially` (Boolean, optional): Whether to run reconciliation sequentially (defaults to false)

**Returns:**
- `Promise<Array>`: Array of reconciliation results

#### install(app)

Install store into Vue application for dependency injection.

```javascript
import { createApp } from 'vue';

const app = createApp(App);
app.use(store);
```

**Parameters:**
- `app` (Object): Vue application instance

## Plugin System

### Plugin Interface

All plugins must implement the following interface:

```javascript
class MyPlugin {
  constructor(options = {}) {
    this.options = options;
  }
  
  async install(store) {
    // Required: Install plugin into store
    // Add methods, modify state, etc.
  }
  
  async reconciliate(store) {
    // Optional: Reconcile plugin state
  }
}
```

### Built-in Plugin Methods

When plugins are installed, they typically add methods to the store:

```javascript
// After installing HydraPlugin
const book = await store.getItem('/books/1');
const books = await store.fetchCollection('/books');
const newBook = await store.createItem({ title: 'New Book' });

// After installing MercurePlugin
const mercure = useMercure();
mercure.subscribe('/books/{id}');
```

## Usage Patterns

### 1. Basic State Management

```javascript
const store = await createStore({
  state: {
    user: null,
    isAuthenticated: false,
    loading: false
  },
  methods: {
    login(state, user) {
      state.user = user;
      state.isAuthenticated = true;
    },
    
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
    },
    
    setLoading(state, loading) {
      state.loading = loading;
    }
  }
});

// Use in component
import { useStore } from 'speculoos';

export default {
  setup() {
    const store = useStore();
    
    const login = async (credentials) => {
      store.setLoading(true);
      try {
        const user = await api.login(credentials);
        store.login(user);
      } finally {
        store.setLoading(false);
      }
    };
    
    return {
      user: computed(() => store.state.user),
      isAuthenticated: computed(() => store.state.isAuthenticated),
      loading: computed(() => store.state.loading),
      login
    };
  }
};
```

### 2. Reactive State with Computed Properties

```javascript
const store = await createStore({
  state: {
    items: [],
    filter: '',
    sortBy: 'name'
  }
});

// Add computed methods
store.filteredItems = computed(() => {
  return store.state.items
    .filter(item => 
      item.name.toLowerCase().includes(store.state.filter.toLowerCase())
    )
    .sort((a, b) => {
      if (store.state.sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
});
```

### 3. Plugin Coordination

```javascript
// Store coordinates between plugins
const store = await createStore({
  state: {
    syncStatus: 'idle'
  }
})
  .use(new HydraPlugin(api))
  .use(new MercurePlugin());

// Reconcile all plugins after major changes
const afterMajorUpdate = async () => {
  store.state.syncStatus = 'reconciling';
  await store.reconciliate();
  store.state.syncStatus = 'idle';
};
```

### 4. Multiple Stores

```javascript
// Create separate stores for different concerns
const mainStore = await createStore({
  state: { user: null, theme: 'light' },
  name: 'main'
});

const dataStore = await createStore({
  state: { books: [], authors: [] },
  name: 'data'
})
  .use(new HydraPlugin(api));

// Use specific stores
const main = useStore('main');
const data = useStore('data');
```

## Advanced Usage

### 1. Custom Plugin Development

```javascript
class CachePlugin {
  constructor(ttl = 300000) { // 5 minutes
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  async install(store) {
    // Wrap store methods with caching
    const originalGetItem = store.getItem;
    
    store.getItem = async (iri, options = {}) => {
      // Check cache first
      const cached = this.get(iri);
      if (cached && !options.skipCache) {
        return cached;
      }
      
      // Fetch from API
      const result = await originalGetItem.call(store, iri, options);
      
      // Cache result
      if (!options.skipCache) {
        this.set(iri, result);
      }
      
      return result;
    };
    
    // Add cache management methods
    store.clearCache = () => this.cache.clear();
    store.getCacheSize = () => this.cache.size;
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (item && Date.now() - item.timestamp < this.ttl) {
      return item.data;
    }
    this.cache.delete(key);
    return null;
  }
  
  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}

// Use the plugin
const store = await createStore({}).use(new CachePlugin(600000)); // 10 minutes
```

### 2. State Persistence

```javascript
class PersistencePlugin {
  constructor(key = 'app-state') {
    this.key = key;
  }
  
  async install(store) {
    // Load persisted state
    const persisted = localStorage.getItem(this.key);
    if (persisted) {
      try {
        const data = JSON.parse(persisted);
        Object.assign(store.state, data);
      } catch (error) {
        console.warn('Failed to load persisted state:', error);
      }
    }
    
    // Save state changes
    watch(store.state, (newState) => {
      localStorage.setItem(this.key, JSON.stringify(newState));
    }, { deep: true });
  }
}

const store = await createStore({
  state: {
    user: null,
    preferences: {}
  }
}).use(new PersistencePlugin('my-app-state'));
```

### 3. DevTools Integration

```javascript
class DevToolsPlugin {
  constructor() {
    this.devtools = null;
  }
  
  async install(store) {
    if (process.env.NODE_ENV === 'development') {
      this.devtools = window.__REDUX_DEVTOOLS_EXTENSION__?.connect({
        name: 'Speculoos Store'
      });
      
      if (this.devtools) {
        // Send initial state
        this.devtools.init(store.state);
        
        // Subscribe to state changes
        watch(store.state, (newState) => {
          this.devtools.send('State Update', newState);
        }, { deep: true });
        
        // Add dispatch method for actions
        store.dispatch = (action) => {
          this.devtools.send(action, store.state);
        };
      }
    }
  }
}

const store = await createStore({}).use(new DevToolsPlugin());
```

## Performance Considerations

### 1. State Size

Keep state minimal for better performance:

```javascript
// Good: Minimal essential state
const store = await createStore({
  state: {
    currentUser: null,
    items: [],
    loading: false
  }
});

// Bad: Large computed or derived state
const store = await createStore({
  state: {
    currentUser: null,
    items: [],
    loading: false,
    computedItems: [], // Should be computed, not stored
    formattedItems: [],  // Should be computed, not stored
    expensiveCalculations: [] // Should be computed, not stored
  }
});
```

### 2. Reactive Granularity

Use appropriate reactivity levels:

```javascript
import { shallowReactive, ref } from 'vue';

const store = await createStore({
  state: {
    // Use ref for primitives
    count: ref(0),
    
    // Use shallowReactive for large objects
    largeDataset: shallowReactive({ items: [], metadata: {} }),
    
    // Use reactive for normal objects
    user: reactive({ name: '', email: '' })
  }
});
```

### 3. Method Optimization

Optimize store methods for performance:

```javascript
const store = await createStore({
  state: { items: [] },
  methods: {
    // Good: Efficient update
    addItem(state, item) {
      state.items.push(item);
    },
    
    // Bad: Inefficient update
    addItems(state, items) {
      state.items = [...state.items, ...items]; // Creates new array
    },
    
    // Good: Batch updates
    addMultipleItems(state, items) {
      state.items.push(...items); // Mutates existing array
    }
  }
});
```

## Error Handling

### 1. Method Error Handling

```javascript
const store = await createStore({
  state: { error: null },
  methods: {
    async loadItems(state) {
      try {
        state.error = null;
        const items = await api.getItems();
        state.items = items;
      } catch (error) {
        state.error = error.message;
        throw error; // Re-throw for component handling
      }
    }
  }
});
```

### 2. Plugin Error Handling

```javascript
class ErrorHandlingPlugin {
  constructor(errorHandler) {
    this.errorHandler = errorHandler;
  }
  
  async install(store) {
    // Wrap store methods with error handling
    const originalMethods = { ...store };
    
    Object.keys(originalMethods).forEach(methodName => {
      if (typeof originalMethods[methodName] === 'function') {
        store[methodName] = async (...args) => {
          try {
            return await originalMethods[methodName](...args);
          } catch (error) {
            this.errorHandler(error, methodName, args);
            throw error;
          }
        };
      }
    });
  }
}
```

## Testing

### 1. Unit Testing Store

```javascript
import { createStore } from 'speculoos';

describe('Store', () => {
  let store;
  
  beforeEach(async () => {
    store = await createStore({
      state: {
        count: 0,
        items: []
      },
      methods: {
        increment(state) {
          state.count++;
        },
        addItem(state, item) {
          state.items.push(item);
        }
      }
    });
  });
  
  test('should increment count', () => {
    store.increment();
    expect(store.state.count).toBe(1);
  });
  
  test('should add item', () => {
    const item = { id: 1, name: 'Test' };
    store.addItem(item);
    expect(store.state.items).toContain(item);
  });
});
```

### 2. Plugin Testing

```javascript
import { createStore } from 'speculoos';

class TestPlugin {
  constructor(value) {
    this.value = value;
  }
  
  async install(store) {
    store.testMethod = () => this.value;
  }
}

describe('Plugin System', () => {
  test('should install plugin', async () => {
    const store = await createStore({});
    await store.use(new TestPlugin('test-value'));
    
    expect(store.testMethod()).toBe('test-value');
  });
});
```

## Best Practices

### 1. State Design

- Keep state flat and normalized
- Use arrays for collections
- Avoid nested objects when possible
- Store minimal required data

### 2. Method Design

- Keep methods focused and single-purpose
- Use descriptive names
- Handle errors appropriately
- Document method contracts

### 3. Plugin Design

- Implement the full plugin interface
- Handle cleanup in destroy methods
- Provide configuration options
- Document plugin behavior

## See Also

- [Core Concepts - Architecture](../core-concepts/architecture.md) - Store architecture details
- [API Reference - Hydra](./hydra.md) - Hydra plugin API
- [API Reference - API Client](./api-client.md) - HTTP client integration