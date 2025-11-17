# Hydra API Reference

The Hydra module provides comprehensive integration with Hydra-powered APIs, including resource management, form handling, endpoints resolution, IRI utilities, and Mercure synchronization. It's the core module for working with API Platform and other Hydra APIs.

## Overview

The Hydra module includes:
- **HydraPlugin**: Main plugin for store integration
- **Resource Factories**: Type-safe resource creation
- **Form Helpers**: Reactive form management
- **Endpoint Management**: Named endpoint resolution
- **IRI Utilities**: Resource identifier manipulation
- **Mercure Integration**: Real-time synchronization

## Core API

### HydraPlugin

Main plugin class that extends store functionality with Hydra capabilities.

```javascript
import { HydraPlugin } from 'speculoos';

const plugin = new HydraPlugin(api, {
  endpoints: {
    books: '/books',
    authors: '/authors'
  },
  classmap: {
    'Book': Book,
    'Author': Author
  },
  errorHandler: (error) => console.error('Hydra error:', error)
});

await store.use(plugin);
```

**Constructor Parameters:**
- `api` (ApiClient): API client instance
- `options` (Object, optional): Configuration options
  - `endpoints` (Object): Named endpoint mappings
  - `classmap` (Object): Type to class mappings
  - `errorHandler` (Function): Custom error handler

### Resource Management Methods

#### getItem(store, itemOrIri, options?)

Fetches a single resource by IRI.

```javascript
const book = await store.getItem('/books/1');
const book = await store.getItem(bookObject);

const book = await store.getItem('/books/1', {
  groups: ['book:read', 'book:details'],
  store: true // Store in cache
});
```

**Parameters:**
- `store` (Object): Store instance
- `itemOrIri` (String|Object): Resource IRI or object with @id
- `options` (Object, optional): Request options
  - `groups` (Array): Serialization groups
  - `store` (Boolean, default: true): Whether to store in cache

**Returns:**
- `Promise<Object>`: Reactive resource object

#### fetchItem(store, iri, options?)

Forces fetching a resource (bypasses cache).

```javascript
const book = await store.fetchItem('/books/1', {
  groups: ['book:read'],
  store: false // Don't store in cache
});
```

**Parameters:**
- `store` (Object): Store instance
- `iri` (String): Resource IRI
- `options` (Object, optional): Request options

**Returns:**
- `Promise<Object>`: Resource object

#### getRelation(store, itemOrIri, options?)

Fetches a related resource with smart caching.

```javascript
const book = await store.getItem('/books/1');
const author = await store.getRelation(book.author);

const author = await store.getRelation('/authors/1', {
  useExisting: true, // Use cached if available
  force: false, // Don't force fetch
  store: true
});
```

**Parameters:**
- `store` (Object): Store instance
- `itemOrIri` (String|Object|Function): Relation IRI, object, or function
- `options` (Object, optional): Request options
  - `useExisting` (Boolean, default: true): Use cached version if available
  - `force` (Boolean, default: false): Force fetch even if cached
  - `store` (Boolean, default: false): Store result in cache

**Returns:**
- `Promise<Object>`: Related resource object

#### getRelations(store, itemsOrIris, options?)

Fetches multiple related resources.

```javascript
const books = await store.fetchCollection('/books');
const authors = await store.getRelations(
  books.map(book => book.author)
);

const authors = await store.getRelations([
  '/authors/1',
  '/authors/2',
  '/authors/3'
]);
```

**Parameters:**
- `store` (Object): Store instance
- `itemsOrIris` (Array|Function): Array of IRIs or function returning array
- `options` (Object, optional): Request options

**Returns:**
- `Promise<Array>`: Array of related resource objects

### Collection Management Methods

#### fetchCollection(store, iri, options?)

Fetches a collection of resources.

```javascript
const collection = await store.fetchCollection('/books');

const collection = await store.fetchCollection('/books', {
  groups: ['book:read'],
  store: true, // Store items in cache
  page: 1,
  itemsPerPage: 10
});
```

**Parameters:**
- `store` (Object): Store instance
- `iri` (String): Collection IRI
- `options` (Object, optional): Request options
  - `groups` (Array): Serialization groups
  - `store` (Boolean, default: false): Store items in cache
  - `page` (Number): Page number
  - `itemsPerPage` (Number): Items per page

**Returns:**
- `Promise<Object>`: Collection object with hydra:member array

### CRUD Operations

#### createItem(store, item, options?)

Creates a new resource.

```javascript
const newBook = await store.createItem({
  title: 'New Book',
  author: '/authors/1'
});

const newBook = await store.createItem(bookData, {
  store: true // Store result in cache
});
```

**Parameters:**
- `store` (Object): Store instance
- `item` (Object): Resource data
- `options` (Object, optional): Request options
  - `store` (Boolean, default: true): Store result in cache

**Returns:**
- `Promise<Object>`: Created resource object

#### updateItem(store, item, options?)

Updates an existing resource.

```javascript
const updatedBook = await store.updateItem({
  '@id': '/books/1',
  title: 'Updated Title'
});

const updatedBook = await store.updateItem(book, {
  store: true // Update cache
});
```

**Parameters:**
- `store` (Object): Store instance
- `item` (Object): Resource object with @id
- `options` (Object, optional): Request options
  - `store` (Boolean, default: true): Store result in cache

**Returns:**
- `Promise<Object>`: Updated resource object

#### upsertItem(store, item, options?)

Creates or updates a resource based on presence of @id.

```javascript
const book = { title: 'New Book' };
const createdBook = await store.upsertItem(book); // Creates

const book = { '@id': '/books/1', title: 'Updated' };
const updatedBook = await store.upsertItem(book); // Updates
```

**Parameters:**
- `store` (Object): Store instance
- `item` (Object): Resource data (with or without @id)
- `options` (Object, optional): Request options

**Returns:**
- `Promise<Object>`: Created or updated resource object

#### deleteItem(store, itemOrIri, options?)

Deletes a resource.

```javascript
await store.deleteItem('/books/1');
await store.deleteItem(bookObject);
```

**Parameters:**
- `store` (Object): Store instance
- `itemOrIri` (String|Object): Resource IRI or object with @id
- `options` (Object, optional): Request options

**Returns:**
- `Promise<void>`: Resolves when deletion is complete

### Store Management Methods

#### storeItem(store, item)

Stores a resource in the internal cache.

```javascript
const book = { '@id': '/books/1', title: 'Book 1' };
const storedBook = store.storeItem(book);
```

**Parameters:**
- `store` (Object): Store instance
- `item` (Object): Resource to store

**Returns:**
- `Object`: Reactive reference to stored item

#### removeItem(store, item)

Removes a resource from the internal cache.

```javascript
store.removeItem('/books/1');
store.removeItem(bookObject);
```

**Parameters:**
- `store` (Object): Store instance
- `item` (String|Object): Resource IRI or object with @id

#### clearItems(store)

Clears all items from the internal cache.

```javascript
await store.clearItems();
```

**Parameters:**
- `store` (Object): Store instance

**Returns:**
- `Promise<void>`: Resolves when cache is cleared

### Utility Methods

#### endpoint(name, ...args)

Resolves a named endpoint with parameters.

```javascript
const plugin = new HydraPlugin(api, {
  endpoints: {
    books: '/books',
    booksByAuthor: (authorId) => `/authors/${authorId}/books`,
    bookDetails: (bookId) => `/books/${bookId}/details`
  }
});

const booksUrl = store.endpoint('books'); // '/books'
const authorBooksUrl = store.endpoint('booksByAuthor', 1); // '/authors/1/books'
const bookDetailsUrl = store.endpoint('bookDetails', 123); // '/books/123/details'
```

**Parameters:**
- `name` (String): Endpoint name
- `...args` (Any): Parameters for endpoint function

**Returns:**
- `String`: Resolved endpoint URL

#### getItemsByType(type)

Gets all items of a specific type from cache.

```javascript
const books = store.getItemsByType('Book');
const authors = store.getItemsByType('Author');
```

**Parameters:**
- `type` (String): Resource type (@type value)

**Returns:**
- `Array`: Array of cached items of specified type

#### factory(typeOrObject, object?)

Creates a typed resource instance.

```javascript
const book = store.factory('Book', {
  title: 'New Book',
  author: '/authors/1'
});

const typedBook = store.factory(bookObject); // Uses object's @type
```

**Parameters:**
- `typeOrObject` (String|Object): Type name or object with @type
- `object` (Object, optional): Data for resource creation

**Returns:**
- `Object`: Typed reactive resource object

## Form Management

### useItemForm(itemInitialState)

Creates a reactive form for managing item data.

```javascript
import { useItemForm } from 'speculoos';

const { item, isUnsavedDraft, isCreationMode, isSubmitting, reset, submit } = useItemForm({
  title: '',
  author: '',
  description: ''
});

// Or with existing item
const { item, isUnsavedDraft, isCreationMode, isSubmitting, reset, submit } = useItemForm(existingBook);
```

**Parameters:**
- `itemInitialState` (Object|Ref): Initial form data or ref to data

**Returns:**
- `Object`: Form management object
  - `item` (Object): Reactive form data
  - `isUnsavedDraft` (Computed): True if form has unsaved changes
  - `isCreationMode` (Computed): True if item has no @id
  - `isSubmitting` (Ref): True if form is currently submitting
  - `reset` (Function): Reset form to initial state
  - `submit` (Function): Submit form data

### normalizeItemRelations(item)

Normalizes object relations to IRIs for API submission.

```javascript
const book = {
  title: 'Book Title',
  author: { '@id': '/authors/1', name: 'Author Name' },
  publisher: '/publishers/1',
  categories: [
    { '@id': '/categories/1', name: 'Fiction' },
    { '@id': '/categories/2', name: 'Drama' }
  ]
};

const normalized = normalizeItemRelations(book);
// Result:
// {
//   title: 'Book Title',
//   author: '/authors/1',
//   publisher: '/publishers/1',
//   categories: ['/categories/1', '/categories/2']
// }
```

**Parameters:**
- `item` (Object): Item with potential relation objects

**Returns:**
- `Object`: Item with normalized relations

### useFormValidation()

Creates form validation utilities.

```javascript
import { useFormValidation } from 'speculoos';

const { resetValidity, bindViolations, unmappedViolations, validate } = useFormValidation();

// Reset form validity
resetValidity(formElement);

// Bind API violations to form
bindViolations(formElement, violations);

// Validate form
const isValid = validate(formElement, false); // Don't show validation UI
```

**Returns:**
- `Object`: Validation utilities
  - `resetValidity` (Function): Clear all validation errors
  - `bindViolations` (Function): Bind constraint violations to form fields
  - `unmappedViolations` (Ref): Array of violations that couldn't be mapped
  - `validate` (Function): Validate form and optionally show UI feedback

## IRI Utilities

### getIri(itemOrIRI)

Extracts the IRI from an item or returns the IRI string.

```javascript
import { getIri } from 'speculoos';

const book = { '@id': '/books/1', title: 'Book 1' };
const iri = getIri(book); // '/books/1'

const iri = getIri('/books/1'); // '/books/1'
const iri = getIri(null); // null
```

**Parameters:**
- `itemOrIRI` (String|Object|null): Item with @id or IRI string

**Returns:**
- `String|null`: IRI string or null

### getId(itemOrIRI)

Extracts the ID portion from an IRI.

```javascript
import { getId } from 'speculoos';

const book = { '@id': '/books/1', title: 'Book 1' };
const id = getId(book); // '1'

const id = getId('/books/123'); // '123'
```

**Parameters:**
- `itemOrIRI` (String|Object): Item with @id or IRI string

**Returns:**
- `String`: ID portion of IRI

### hasIri(item)

Checks if an object has a valid IRI.

```javascript
import { hasIri } from 'speculoos';

const book = { '@id': '/books/1' };
const hasId = hasIri(book); // true

const book = { title: 'Book 1' };
const hasId = hasIri(book); // false

const hasId = hasIri(null); // false
```

**Parameters:**
- `item` (Object|null): Object to check

**Returns:**
- `Boolean`: True if object has valid @id

### areSameIris(a, b)

Compares two items/IRIs for equality.

```javascript
import { areSameIris } from 'speculoos';

const book1 = { '@id': '/books/1' };
const book2 = { '@id': '/books/1' };
const same = areSameIris(book1, book2); // true

const same = areSameIris('/books/1', '/books/1'); // true
const same = areSameIris('/books/1', '/books/2'); // false
```

**Parameters:**
- `a` (String|Object): First item or IRI
- `b` (String|Object): Second item or IRI

**Returns:**
- `Boolean`: True if IRIs are the same

### getItemByIri(items, iri)

Finds an item in an array by its IRI.

```javascript
import { getItemByIri } from 'speculoos';

const books = [
  { '@id': '/books/1', title: 'Book 1' },
  { '@id': '/books/2', title: 'Book 2' }
];

const book = getItemByIri(books, '/books/1');
// Returns: { '@id': '/books/1', title: 'Book 1' }
```

**Parameters:**
- `items` (Array): Array of items with @id
- `iri` (String): IRI to find

**Returns:**
- `Object|null`: Found item or null

### partialItem(item, mergeWith)

Creates a partial item with only specific fields.

```javascript
import { partialItem } from 'speculoos';

const book = {
  '@id': '/books/1',
  '@type': 'Book',
  title: 'Full Title',
  author: '/authors/1',
  description: 'Full description',
  publishedAt: '2023-01-01'
};

const partial = partialItem(book, {
  title: 'Partial Title',
  status: 'draft'
});

// Result:
// {
//   '@id': '/books/1',
//   '@type': 'Book',
//   title: 'Partial Title',
//   status: 'draft'
// }
```

**Parameters:**
- `item` (Object): Source item with @id and @type
- `mergeWith` (Object): Fields to merge into partial item

**Returns:**
- `Object`: Partial item with merged fields

## Mercure Integration

### mercureSync(mercure, items, topics?, onUpdate?, onDelete?)

Sets up real-time synchronization for items.

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
- `mercure` (Object): Mercure client instance
- `items` (Array|Ref): Reactive array of items to sync
- `topics` (Array, optional): Topics to subscribe to (default: ['*'])
- `onUpdate` (Function, optional): Update handler function
- `onDelete` (Function, optional): Delete handler function

**Returns:**
- `Function`: Listener function for cleanup

### on(mercure, topics, callback)

Subscribes to topics with a callback.

```javascript
import { on } from 'speculoos';

const listener = on(mercure, ['/books/{id}', '/authors/{id}'], (data) => {
  console.log('Received update:', data);
  
  if (data['@type'] === 'Book') {
    // Handle book update
  } else if (data['@type'] === 'Author') {
    // Handle author update
  }
});
```

**Parameters:**
- `mercure` (Object): Mercure client instance
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

## Resource Factories

### Built-in Factories

#### HydraCollection

Factory for Hydra collection objects.

```javascript
import { HydraCollection } from 'speculoos';

const collection = {
  '@id': '/books',
  '@type': 'hydra:Collection',
  'hydra:member': [...],
  'hydra:totalItems': 100,
  'hydra:view': {
    '@id': '/books?page=1',
    '@type': 'hydra:PartialCollectionView'
  }
};

const factory = new HydraPlugin(api);
const collectionObj = factory.factory(collection);
// collectionObj is an instance of HydraCollection with helper methods
```

#### HydraError

Factory for Hydra error objects.

```javascript
import { HydraError } from 'speculoos';

const errorData = {
  '@type': 'hydra:Error',
  'hydra:description': 'Resource not found',
  'hydra:title': 'An error occurred'
};

const factory = new HydraPlugin(api);
const errorObj = factory.factory(errorData, 404);
// errorObj is an instance of HydraError
```

#### ConstraintViolationList

Factory for validation error objects.

```javascript
import { ConstraintViolationList } from 'speculoos';

const violationsData = {
  '@type': 'ConstraintViolationList',
  violations: [
    {
      propertyPath: 'title',
      message: 'Title is required'
    }
  ]
};

const factory = new HydraPlugin(api);
const violationsObj = factory.factory(violationsData, 422);
// violationsObj is an instance of ConstraintViolationList
```

### Custom Factories

Create custom resource factories by extending base classes:

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

const plugin = new HydraPlugin(api, {
  classmap: {
    'Book': Book
  }
});

// Fetched books will be instances of Book class
const book = await store.getItem('/books/1');
console.log(book.displayTitle); // Works!
book.publish(); // Works!
```

## Advanced Usage

### 1. Custom Error Handling

```javascript
const plugin = new HydraPlugin(api, {
  errorHandler: (error) => {
    if (error instanceof ConstraintViolationList) {
      // Handle validation errors
      error.violations.forEach(violation => {
        showFieldError(violation.propertyPath, violation.message);
      });
    } else if (error instanceof HydraError) {
      // Handle Hydra errors
      showError(error['hydra:description']);
    } else {
      // Handle other errors
      showError('An unexpected error occurred');
    }
  }
});
```

### 2. Custom Endpoint Resolution

```javascript
const plugin = new HydraPlugin(api, {
  endpoints: {
    // Static endpoints
    books: '/books',
    authors: '/authors',
    
    // Dynamic endpoints with parameters
    booksByAuthor: (authorId) => `/authors/${authorId}/books`,
    bookWithVersion: (bookId, version) => `/books/${bookId}?version=${version}`,
    
    // Complex endpoints
    search: (query, filters) => {
      const params = new URLSearchParams({ q: query });
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      return `/search?${params}`;
    }
  }
});

// Usage
const authorBooks = store.endpoint('booksByAuthor', 123);
const versionedBook = store.endpoint('bookWithVersion', 456, 'v2');
const searchUrl = store.endpoint('search', 'javascript', { type: 'book', year: 2023 });
```

### 3. Batch Operations

```javascript
// Create multiple items
const createMultiple = async (items) => {
  return Promise.all(
    items.map(item => store.createItem(item))
  );
};

// Update multiple items
const updateMultiple = async (items) => {
  return Promise.all(
    items.map(item => store.updateItem(item))
  );
};

// Delete multiple items
const deleteMultiple = async (items) => {
  return Promise.all(
    items.map(item => store.deleteItem(item))
  );
};
```

## Testing

### 1. Mock Hydra Plugin

```javascript
import { HydraPlugin } from 'speculoos';

const mockApi = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
};

const plugin = new HydraPlugin(mockApi);
const store = await createStore({}).use(plugin);

// Test resource fetching
mockApi.get.mockResolvedValue({
  data: { '@id': '/books/1', title: 'Test Book' }
});

const book = await store.getItem('/books/1');
expect(book.title).toBe('Test Book');
expect(mockApi.get).toHaveBeenCalledWith('/books/1', {});
```

### 2. Form Testing

```javascript
import { useItemForm } from 'speculoos';

describe('Item Form', () => {
  test('should track unsaved changes', () => {
    const { item, isUnsavedDraft } = useItemForm({
      title: 'Original Title'
    });
    
    expect(isUnsavedDraft.value).toBe(false);
    
    item.title = 'Modified Title';
    expect(isUnsavedDraft.value).toBe(true);
  });
  
  test('should detect creation mode', () => {
    const { isCreationMode } = useItemForm({
      title: 'New Book'
    });
    
    expect(isCreationMode.value).toBe(true);
    
    const { isCreationMode: updateMode } = useItemForm({
      '@id': '/books/1',
      title: 'Existing Book'
    });
    
    expect(updateMode.value).toBe(false);
  });
});
```

## Best Practices

### 1. Resource Management

- Always use IRI-based operations for consistency
- Store frequently accessed resources in cache
- Use getRelation() for related data to avoid N+1 problems
- Implement proper error handling for all operations

### 2. Form Handling

- Use useItemForm() for consistent form behavior
- Normalize relations before submission
- Handle validation errors appropriately
- Reset form state after successful submission

### 3. Performance

- Use fetchItem() only when you need fresh data
- Leverage caching for frequently accessed resources
- Batch operations when possible
- Use Mercure for real-time updates instead of polling

## See Also

- [Core Concepts - Hydra](../core-concepts/hydra.md) - Hydra concepts and usage
- [API Reference - Store](./store.md) - Store integration
- [API Reference - Mercure](./mercure.md) - Real-time synchronization
- [Guides - Basic CRUD](../guides/basic-crud.md) - Practical CRUD examples