# Understanding Hydra

Hydra is a set of specifications that simplify the development of interoperable hypermedia-driven Web APIs. Speculoos is built around Hydra concepts and provides seamless integration with Hydra-powered APIs like API Platform.

## What is Hydra?

Hydra (Hyper-driven Web APIs) is a vocabulary for hypermedia-driven Web APIs that enables:

- **Self-describing APIs** - APIs that describe their own capabilities
- **Hypermedia controls** - Links that guide clients through available actions
- **Type safety** - Strongly typed resources and operations
- **Documentation generation** - Automatic API documentation
- **Client generation** - Automatic client SDK generation

## Core Concepts

### 1. Resources and IRIs

In Hydra, everything is a resource identified by an IRI (Internationalized Resource Identifier):

```json
{
  "@id": "/books/1",
  "@type": "Book",
  "title": "The Great Gatsby",
  "author": "/authors/1"
}
```

- `@id`: The unique identifier for the resource
- `@type`: The resource type
- Other properties: Resource-specific data

### 2. Collections

Collections are special resources that contain other resources:

```json
{
  "@id": "/books",
  "@type": "hydra:Collection",
  "hydra:member": [
    {
      "@id": "/books/1",
      "@type": "Book",
      "title": "The Great Gatsby"
    }
  ],
  "hydra:totalItems": 1,
  "hydra:view": {
    "@id": "/books?page=1",
    "@type": "hydra:PartialCollectionView",
    "hydra:first": "/books?page=1",
    "hydra:last": "/books?page=1",
    "hydra:next": "/books?page=2"
  }
}
```

### 3. Operations

Operations define what actions can be performed on resources:

```json
{
  "@id": "/books",
  "@type": "hydra:Collection",
  "hydra:operation": [
    {
      "@type": "hydra:Operation",
      "hydra:method": "POST",
      "hydra:expects": "Book",
      "hydra:returns": "Book"
    },
    {
      "@type": "hydra:Operation",
      "hydra:method": "GET",
      "hydra:returns": "hydra:Collection"
    }
  ]
}
```

### 4. Entry Points

The entry point (API documentation) describes all available resources:

```json
{
  "@context": "/contexts/EntryPoint",
  "@id": "/",
  "@type": "EntryPoint",
  "books": "/books",
  "authors": "/authors",
  "publishers": "/publishers"
}
```

## How Speculoos Uses Hydra

### 1. Resource Management

Speculoos automatically manages Hydra resources through the store:

```javascript
import { useStore } from 'speculoos';

const store = useStore();

// Fetch a single resource
const book = await store.getItem('/books/1');

// Fetch a collection
const books = await store.fetchCollection('/books');

// Create a new resource
const newBook = await store.createItem({
  title: 'New Book',
  author: '/authors/1'
});

// Update a resource
const updatedBook = await store.updateItem({
  '@id': '/books/1',
  title: 'Updated Title'
});

// Delete a resource
await store.deleteItem('/books/1');
```

### 2. Type Mapping

Speculoos maps Hydra types to JavaScript classes:

```javascript
import { HydraPlugin } from 'speculoos';

class Book {
  constructor() {
    this.title = '';
    this.author = null;
  }
  
  get displayTitle() {
    return this.title.toUpperCase();
  }
}

const plugin = new HydraPlugin(api, {
  classmap: {
    'Book': Book
  }
});

// Now fetched books will be instances of Book
const book = await store.getItem('/books/1');
console.log(book.displayTitle); // Works!
```

### 3. Endpoint Resolution

Speculoos can resolve endpoints by name:

```javascript
const plugin = new HydraPlugin(api, {
  endpoints: {
    books: '/books',
    authors: '/authors',
    booksByAuthor: (authorId) => `/authors/${authorId}/books`
  }
});

// Use named endpoints
const books = await store.fetchCollection(store.endpoint('books'));
const authorBooks = await store.fetchCollection(
  store.endpoint('booksByAuthor', 1)
);
```

### 4. IRI Utilities

Speculoos provides utilities for working with IRIs:

```javascript
import { getIri, getId, hasIri, areSameIris } from 'speculoos';

const book = { '@id': '/books/1', title: 'Book 1' };

console.log(getIri(book)); // '/books/1'
console.log(getId(book)); // '1'
console.log(hasIri(book)); // true
console.log(areSameIris(book, '/books/1')); // true
```

## API Platform Integration

Speculoos works seamlessly with API Platform, which extends Hydra with additional features:

### 1. Serialization Groups

Control what data is included in responses:

```javascript
// Fetch with specific groups
const book = await store.fetchItem('/books/1', {
  groups: ['book:read', 'book:details']
});

const books = await store.fetchCollection('/books', {
  groups: ['book:read']
});
```

### 2. Filters

API Platform filters are automatically handled:

```javascript
// Apply filters via query parameters
const filteredBooks = await store.fetchCollection(
  '/books?title[contains]=great&author=1'
);
```

### 3. Pagination

Pagination is built into collections:

```javascript
const books = await store.fetchCollection('/books?page=2&itemsPerPage=10');

console.log(books['hydra:totalItems']); // Total number of items
console.log(books['hydra:view']['hydra:next']); // Next page link
```

## Working with Hydra in Speculoos

### 1. Resource Factory

Create custom resource types:

```javascript
import { reactive } from 'vue';

class Book {
  constructor(data) {
    Object.assign(this, data);
  }
  
  get isPublished() {
    return this.status === 'published';
  }
  
  publish() {
    this.status = 'published';
  }
}

// Register with Hydra plugin
const plugin = new HydraPlugin(api, {
  classmap: {
    'Book': Book
  }
});

// Resources are automatically wrapped
const book = await store.getItem('/books/1');
console.log(book.isPublished); // Reactive property
book.publish(); // Method call
```

### 2. Error Handling

Hydra errors are automatically parsed:

```javascript
try {
  await store.createItem(invalidData);
} catch (error) {
  if (error instanceof ConstraintViolationList) {
    error.violations.forEach(violation => {
      console.log(`${violation.propertyPath}: ${violation.message}`);
    });
  }
}
```

### 3. Relations

Handle resource relations automatically:

```javascript
const book = await store.getItem('/books/1');

// Relations are automatically resolved
const author = await store.getRelation(book.author);
const books = await store.getRelations([
  '/books/1',
  '/books/2',
  '/books/3'
]);
```

## Best Practices

### 1. Use Type Safety

Define TypeScript interfaces for your resources:

```typescript
interface Book {
  '@id': string;
  '@type': 'Book';
  id: number;
  title: string;
  author: string | Author;
  publishedAt?: string;
}

interface Author {
  '@id': string;
  '@type': 'Author';
  id: number;
  name: string;
  books: Book[];
}
```

### 2. Leverage Reactivity

Take advantage of Vue's reactivity:

```javascript
import { ref, watch } from 'vue';

const books = ref([]);

watch(books, (newBooks) => {
  console.log('Books updated:', newBooks.length);
});

// Store updates will automatically trigger the watcher
await store.fetchCollection('/books');
```

### 3. Use Collections Efficiently

Store collections in the store for better performance:

```javascript
// Store the collection
const collection = await store.fetchCollection('/books', { store: true });

// Access individual items without additional requests
const book = store.getItem('/books/1'); // Returns from cache
```

### 4. Handle Loading States

Use the built-in loading state management:

```javascript
const loading = ref(false);

try {
  loading.value = true;
  const books = await store.fetchCollection('/books');
} finally {
  loading.value = false;
}
```

## Advanced Features

### 1. Custom Operations

Define custom operations beyond basic CRUD:

```javascript
const customOperations = {
  publishBook: async (book) => {
    return await store.handle(() => 
      api.post(`${getIri(book)}/publish`)
    );
  }
};

store.publishBook = customOperations.publishBook;
```

### 2. Batch Operations

Perform multiple operations efficiently:

```javascript
const books = [
  { title: 'Book 1', author: '/authors/1' },
  { title: 'Book 2', author: '/authors/1' }
];

// Create multiple books
const createdBooks = await Promise.all(
  books.map(book => store.createItem(book))
);
```

### 3. Caching Strategies

Implement intelligent caching:

```javascript
// Cache with TTL
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getItemWithCache = async (iri) => {
  const cached = cache.get(iri);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const item = await store.getItem(iri);
  cache.set(iri, { data: item, timestamp: Date.now() });
  return item;
};
```

## Troubleshooting

### Common Issues

1. **Circular References**: Use the built-in clone utility
2. **Missing Types**: Ensure proper classmap configuration
3. **IRI Resolution**: Check endpoint configuration
4. **Serialization**: Verify API Platform serialization groups

### Debug Tools

Use browser dev tools to inspect Hydra responses:

```javascript
// Enable debug mode
const plugin = new HydraPlugin(api, {
  debug: true
});

// Inspect raw responses
const response = await api.get('/books');
console.log(response.data); // Raw Hydra data
```

## Next Steps

To learn more about working with Hydra in Speculoos:

- [API Reference - Hydra](../api-reference/hydra.md) - Detailed API documentation
- [API Reference - Store](../api-reference/store.md) - Store and plugin system
- [Guides - Basic CRUD](../guides/basic-crud.md) - Practical CRUD examples
- [Guides - Form Handling](../guides/form-handling.md) - Working with forms

For more information about Hydra itself:

- [Hydra Documentation](https://www.hydra-cg.com/)
- [API Platform Documentation](https://api-platform.com/)
- [JSON-LD Playground](https://json-ld.org/playground/)