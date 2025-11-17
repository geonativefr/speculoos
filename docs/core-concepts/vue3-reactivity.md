# Vue 3 Reactivity in Speculoos

Speculoos is built around Vue 3's reactivity system, leveraging the Composition API and reactivity primitives to create seamless, reactive data flows between your API and UI. Understanding Vue 3 reactivity is key to using Speculoos effectively.

## Vue 3 Reactivity Fundamentals

### 1. Reactive Primitives

Vue 3 provides several ways to create reactive data:

```javascript
import { ref, reactive, computed, watch, watchEffect } from 'vue';

// ref() - Creates reactive reference to primitive values
const count = ref(0);
console.log(count.value); // Access with .value

// reactive() - Creates reactive object
const user = reactive({
  name: 'John',
  email: 'john@example.com'
});
console.log(user.name); // Direct property access

// computed() - Creates computed property
const fullName = computed(() => `${user.firstName} ${user.lastName}`);

// watch() - Watches for changes
watch(count, (newValue, oldValue) => {
  console.log(`Count changed from ${oldValue} to ${newValue}`);
});

// watchEffect() - Runs immediately and tracks dependencies
watchEffect(() => {
  console.log(`Current count: ${count.value}`);
});
```

### 2. Ref vs Reactive

```javascript
// Use ref() for primitives
const count = ref(0);
const isLoading = ref(false);
const error = ref(null);

// Use reactive() for objects
const form = reactive({
  title: '',
  author: '',
  publishedAt: ''
});

// You can wrap objects with ref() if you need to replace them entirely
const books = ref([]);
books.value = await fetchBooks(); // Replace entire array
```

## How Speculoos Uses Reactivity

### 1. Store State

The Speculoos store uses Vue's reactivity:

```javascript
import { createStore } from 'speculoos';

const store = await createStore({
  state: reactive({
    books: [],
    currentUser: null,
    loading: false,
    error: null
  }),
  methods: {
    setBooks(state, books) {
      state.books = books; // Triggers reactivity
    },
    setLoading(state, loading) {
      state.loading = loading;
    }
  }
});

// State is reactive, so components will update automatically
const books = computed(() => store.state.books);
const loading = computed(() => store.state.loading);
```

### 2. API Client Reactivity

The API Client integrates with Vue reactivity:

```javascript
import { ApiClient } from 'speculoos';

const api = new ApiClient({ baseUri: 'https://api.example.com' });

// Reactive loading states
const isLoading = ref(false);

// Reactive abort controller
const aborted = ref(false);

// Pass reactive refs to API calls
const response = await api.get('/books', {
  isLoading, // Automatically managed
  aborted    // Can be used to abort request
});

// isLoading.value is now false automatically
```

### 3. Hydra Plugin Reactivity

Hydra plugin creates reactive resources:

```javascript
import { HydraPlugin } from 'speculoos';

const plugin = new HydraPlugin(api);

// Fetched resources are reactive
const book = await store.getItem('/books/1');

// Changes to book will trigger UI updates
book.title = 'Updated Title'; // Reactive update

// Collections are also reactive
const collection = await store.fetchCollection('/books');
collection['hydra:member'].push(newBook); // Reactive update
```

## Reactive Patterns in Speculoos

### 1. Reactive Data Fetching

Create reactive data fetching composables:

```javascript
import { ref, computed, watch } from 'vue';
import { useStore } from 'speculoos';

export function useBooks() {
  const store = useStore();
  const books = ref([]);
  const loading = ref(false);
  const error = ref(null);
  
  const fetchBooks = async () => {
    try {
      loading.value = true;
      error.value = null;
      const collection = await store.fetchCollection('/books');
      books.value = collection['hydra:member'];
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };
  
  // Computed properties
  const publishedBooks = computed(() => 
    books.value.filter(book => book.status === 'published')
  );
  
  const booksCount = computed(() => books.value.length);
  
  return {
    books,
    loading,
    error,
    publishedBooks,
    booksCount,
    fetchBooks
  };
}
```

### 2. Reactive Forms

Create reactive forms with validation:

```javascript
import { reactive, computed, watch } from 'vue';
import { useItemForm } from 'speculoos';

export function useBookForm(initialBook = {}) {
  // Use Speculoos form helper
  const { item: form, isSubmitting, reset, submit } = useItemForm({
    title: '',
    author: '',
    publishedAt: '',
    ...initialBook
  });
  
  // Reactive validation
  const errors = reactive({
    title: '',
    author: '',
    publishedAt: ''
  });
  
  const isValid = computed(() => {
    return form.title.trim() !== '' && 
           form.author.trim() !== '' &&
           errors.title === '' &&
           errors.author === '';
  });
  
  // Watch for changes and validate
  watch(() => form.title, (title) => {
    errors.title = title.trim() === '' ? 'Title is required' : '';
  });
  
  watch(() => form.author, (author) => {
    errors.author = author.trim() === '' ? 'Author is required' : '';
  });
  
  const handleSubmit = async () => {
    if (!isValid.value) return;
    
    try {
      await submit();
      reset();
    } catch (error) {
      console.error('Form submission failed:', error);
    }
  };
  
  return {
    form,
    errors,
    isValid,
    isSubmitting,
    handleSubmit,
    reset
  };
}
```

### 3. Reactive Filtering

Create reactive filters with Vue Router:

```javascript
import { ref, computed, watch } from 'vue';
import { useFilters, TextFilter, ItemFilter } from 'speculoos';
import { useRouter, useRoute } from 'vue-router';

export function useBookFilters() {
  const router = useRouter();
  const route = useRoute();
  
  // Create reactive filters
  const { filters, submit, clear } = useFilters(() => ({
    search: new TextFilter('title'),
    author: new ItemFilter('author'),
    status: new ItemFilter('status')
  }), {
    preserveQuery: true
  });
  
  // Computed filtered data
  const activeFilters = computed(() => {
    const normalized = filters.normalize();
    return Object.keys(normalized).filter(key => normalized[key]);
  });
  
  const hasActiveFilters = computed(() => activeFilters.value.length > 0);
  
  // Apply filters
  const applyFilters = () => {
    submit();
  };
  
  // Clear all filters
  const clearAllFilters = () => {
    clear();
    submit();
  };
  
  return {
    filters,
    activeFilters,
    hasActiveFilters,
    applyFilters,
    clearAllFilters
  };
}
```

### 4. Reactive Pagination

Create reactive pagination:

```javascript
import { ref, computed, watch } from 'vue';
import { createPager } from 'speculoos';

export function usePagination(initialPage = 1, itemsPerPage = 10) {
  const currentPage = ref(initialPage);
  const totalItems = ref(0);
  
  // Create reactive pager
  const pager = computed(() => {
    return createPager({
      currentPage: currentPage.value,
      itemsPerPage,
      totalItems: totalItems.value
    });
  });
  
  // Computed pagination info
  const hasNextPage = computed(() => 
    pager.value.currentPage < pager.value.lastPage
  );
  
  const hasPreviousPage = computed(() => 
    pager.value.currentPage > 1
  );
  
  const pageNumbers = computed(() => pager.value.pages);
  
  const truncatedPages = computed(() => 
    pager.value.truncate(2, true)
  );
  
  // Navigation methods
  const goToPage = (page) => {
    if (page >= 1 && page <= pager.value.lastPage) {
      currentPage.value = page;
    }
  };
  
  const nextPage = () => {
    if (hasNextPage.value) {
      currentPage.value++;
    }
  };
  
  const previousPage = () => {
    if (hasPreviousPage.value) {
      currentPage.value--;
    }
  };
  
  const firstPage = () => {
    currentPage.value = 1;
  };
  
  const lastPage = () => {
    currentPage.value = pager.value.lastPage;
  };
  
  // Update total items
  const setTotalItems = (total) => {
    totalItems.value = total;
  };
  
  // Watch page changes
  watch(currentPage, (newPage) => {
    console.log(`Navigated to page ${newPage}`);
  });
  
  return {
    currentPage,
    totalItems,
    pager,
    hasNextPage,
    hasPreviousPage,
    pageNumbers,
    truncatedPages,
    goToPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    setTotalItems
  };
}
```

## Advanced Reactivity Patterns

### 1. Reactive Collections

Create reactive collections with automatic updates:

```javascript
import { reactive, computed, watch } from 'vue';
import { useMercureSync } from 'speculoos';

export function useReactiveCollection(resourceType) {
  const items = reactive([]);
  const loading = ref(false);
  const mercureSync = useMercureSync();
  
  // Computed properties
  const count = computed(() => items.length);
  const isEmpty = computed(() => items.length === 0);
  
  // Find methods
  const findById = (id) => items.find(item => item.id === id);
  const findByIri = (iri) => items.find(item => item['@id'] === iri);
  
  // CRUD operations
  const add = (item) => {
    const index = items.findIndex(existing => existing['@id'] === item['@id']);
    if (index >= 0) {
      items[index] = item; // Update existing
    } else {
      items.push(item); // Add new
    }
  };
  
  const remove = (itemOrIri) => {
    const iri = typeof itemOrIri === 'string' ? itemOrIri : itemOrIri['@id'];
    const index = items.findIndex(item => item['@id'] === iri);
    if (index >= 0) {
      items.splice(index, 1);
    }
  };
  
  const clear = () => {
    items.length = 0;
  };
  
  // Set up Mercure sync
  const setupSync = () => {
    mercureSync.synchronize(
      items,
      [`/${resourceType}/{id}`],
      // Update handler
      (update, item) => {
        Object.assign(item, update);
      },
      // Delete handler
      (iri) => {
        remove(iri);
      }
    );
  };
  
  // Load initial data
  const load = async (endpoint) => {
    try {
      loading.value = true;
      const store = useStore();
      const collection = await store.fetchCollection(endpoint);
      
      // Clear and add items
      clear();
      collection['hydra:member'].forEach(item => add(item));
      
      // Set up sync after loading
      setupSync();
    } finally {
      loading.value = false;
    }
  };
  
  return {
    items,
    loading,
    count,
    isEmpty,
    findById,
    findByIri,
    add,
    remove,
    clear,
    load
  };
}
```

### 2. Reactive State Machines

Create reactive state machines for complex UI states:

```javascript
import { ref, computed, watch } from 'vue';

export function useStateMachine(initialState, transitions) {
  const currentState = ref(initialState);
  
  // Available transitions from current state
  const availableTransitions = computed(() => {
    return transitions[currentState.value] || [];
  });
  
  // Can transition to specific state
  const canTransitionTo = (state) => {
    return availableTransitions.value.includes(state);
  };
  
  // Transition to new state
  const transition = (newState) => {
    if (canTransitionTo(newState)) {
      currentState.value = newState;
      return true;
    }
    return false;
  };
  
  // Watch state changes
  const onStateChange = (callback) => {
    watch(currentState, (newState, oldState) => {
      callback(newState, oldState);
    });
  };
  
  return {
    currentState,
    availableTransitions,
    canTransitionTo,
    transition,
    onStateChange
  };
}

// Usage example
const formState = useStateMachine('idle', {
  idle: ['editing', 'loading'],
  editing: ['idle', 'submitting'],
  submitting: ['editing', 'success', 'error'],
  success: ['idle'],
  error: ['editing', 'idle']
});

formState.onStateChange((newState) => {
  console.log(`Form state changed to: ${newState}`);
});
```

### 3. Reactive Caching

Create reactive cache with automatic invalidation:

```javascript
import { reactive, ref, computed, watch } from 'vue';

export function useReactiveCache(ttl = 5 * 60 * 1000) { // 5 minutes default
  const cache = reactive(new Map());
  const lastAccessed = reactive(new Map());
  
  // Check if cache entry is valid
  const isValid = (key) => {
    const timestamp = lastAccessed.get(key);
    return timestamp && (Date.now() - timestamp) < ttl;
  };
  
  // Get from cache
  const get = (key) => {
    if (cache.has(key) && isValid(key)) {
      lastAccessed.set(key, Date.now());
      return cache.get(key);
    }
    return null;
  };
  
  // Set in cache
  const set = (key, value) => {
    cache.set(key, value);
    lastAccessed.set(key, Date.now());
  };
  
  // Remove from cache
  const remove = (key) => {
    cache.delete(key);
    lastAccessed.delete(key);
  };
  
  // Clear cache
  const clear = () => {
    cache.clear();
    lastAccessed.clear();
  };
  
  // Clean expired entries
  const clean = () => {
    const now = Date.now();
    for (const [key, timestamp] of lastAccessed) {
      if (now - timestamp >= ttl) {
        remove(key);
      }
    }
  };
  
  // Cache statistics
  const stats = computed(() => ({
    size: cache.size,
    hitRate: 0, // Would need to track hits/misses
    memoryUsage: JSON.stringify([...cache.entries()]).length
  }));
  
  // Clean expired entries periodically
  const cleanupInterval = setInterval(clean, ttl / 2);
  
  // Cleanup on unmount
  const stopCleanup = () => {
    clearInterval(cleanupInterval);
  };
  
  return {
    get,
    set,
    remove,
    clear,
    clean,
    stats,
    stopCleanup
  };
}
```

## Performance Considerations

### 1. Avoiding Unnecessary Reactivity

Use `shallowRef` and `shallowReactive` for large datasets:

```javascript
import { shallowRef, shallowReactive } from 'vue';

// For large arrays where you don't need deep reactivity
const largeDataset = shallowRef([]);

// For large objects where you don't need deep reactivity
const largeObject = shallowReactive({
  items: [],
  metadata: {}
});

// Trigger updates manually when needed
const updateDataset = (newData) => {
  largeDataset.value = newData; // Triggers reactivity
};
```

### 2. Computed Property Caching

Leverage computed property caching:

```javascript
// Good: Expensive computation is cached
const expensiveValue = computed(() => {
  console.log('Computing expensive value...');
  return items.value.reduce((sum, item) => sum + item.value, 0);
});

// Bad: Function runs every time
const getExpensiveValue = () => {
  console.log('Computing expensive value...');
  return items.value.reduce((sum, item) => sum + item.value, 0);
};
```

### 3. Watch Optimization

Optimize watchers for performance:

```javascript
// Good: Watch specific properties
watch(() => form.title, (newTitle) => {
  validateTitle(newTitle);
});

watch(() => form.author, (newAuthor) => {
  validateAuthor(newAuthor);
});

// Bad: Watch entire object (runs for any change)
watch(form, (newForm) => {
  validateTitle(newForm.title);
  validateAuthor(newForm.author);
}, { deep: true });

// Good: Use immediate and flush options
watch(searchTerm, (newTerm) => {
  performSearch(newTerm);
}, { 
  immediate: true,  // Run immediately
  flush: 'post'    // Run after DOM updates
});
```

## Debugging Reactivity

### 1. Vue DevTools

Use Vue DevTools to inspect reactivity:

```javascript
// Make objects easier to debug
const debugState = reactive({
  books: [],
  loading: false,
  // Add debug info
  __debug: {
    lastUpdated: new Date(),
    version: '1.0.0'
  }
});
```

### 2. Reactive Logging

Log reactivity changes:

```javascript
import { watchEffect } from 'vue';

const logReactivity = (name, reactiveObject) => {
  watchEffect(() => {
    console.log(`${name} changed:`, JSON.parse(JSON.stringify(reactiveObject)));
  });
};

// Usage
const books = ref([]);
logReactivity('books', books);
```

### 3. Performance Profiling

Profile reactivity performance:

```javascript
const profileReactivity = (name, fn) => {
  return (...args) => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    
    console.log(`${name} took ${end - start} milliseconds`);
    return result;
  };
};

// Usage
const expensiveComputed = computed(() => 
  profileReactivity('expensive computation', () => {
    return items.value.reduce((sum, item) => sum + item.value, 0);
  })()
);
```

## Best Practices

### 1. Component Composition

Compose reactive logic in composables:

```javascript
// Good: Reusable composable
export function useAsyncData(fetcher, dependencies = []) {
  const data = ref(null);
  const loading = ref(false);
  const error = ref(null);
  
  const execute = async (...args) => {
    try {
      loading.value = true;
      error.value = null;
      data.value = await fetcher(...args);
    } catch (err) {
      error.value = err;
    } finally {
      loading.value = false;
    }
  };
  
  // Watch dependencies and re-execute
  watch(dependencies, execute, { deep: true });
  
  return { data, loading, error, execute };
}
```

### 2. Reactive Props

Pass reactive data between components:

```javascript
// Parent component
const parentData = ref({ message: 'Hello' });

// Child component
const props = defineProps(['data']);

// Make prop reactive locally
const localData = toRef(props, 'data');

// Or use computed
const computedData = computed(() => props.data);
```

### 3. Event-Driven Updates

Use events for reactive updates:

```javascript
import { mitt } from 'mitt';

const eventBus = mitt();

// Component A
const updateData = (newData) => {
  data.value = newData;
  eventBus.emit('data-updated', newData);
};

// Component B
eventBus.on('data-updated', (newData) => {
  localData.value = newData;
});
```

## Next Steps

To learn more about Vue 3 reactivity in Speculoos:

- [API Reference - Store](../api-reference/store.md) - Store reactivity patterns
- [API Reference - Hydra](../api-reference/hydra.md) - Reactive resource management
- [Guides - Real-time Updates](../guides/real-time-updates.md) - Reactive real-time patterns

For more information about Vue 3 reactivity:

- [Vue 3 Reactivity Documentation](https://vuejs.org/guide/reactivity.html)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Vue 3 Reactivity in Depth](https://vuejs.org/guide/extras/reactivity-in-depth.html)