# Understanding Vulcain

Vulcain is a protocol that dramatically improves the performance of hypermedia APIs by allowing clients to request only the data they need, when they need it. Speculoos provides built-in support for Vulcain to optimize API requests and reduce data transfer.

## What is Vulcain?

Vulcain is a protocol that extends Hydra and JSON-LD APIs with:

- **Field Selection** - Request only specific properties
- **Relation Preloading** - Preload related resources
- **Conditional Requests** - Smart caching and validation
- **Push Updates** - Server-initiated data updates
- **Bandwidth Optimization** - Reduce unnecessary data transfer

## Core Concepts

### 1. Field Selection

Request only the fields you need:

```http
GET /books/1
Accept: application/ld+json
Fields: "title","author","publishedAt"
```

Response:
```json
{
  "@id": "/books/1",
  "@type": "Book",
  "title": "The Great Gatsby",
  "author": "/authors/1",
  "publishedAt": "1925-04-10"
}
```

### 2. Relation Preloading

Preload related resources in a single request:

```http
GET /books/1
Accept: application/ld+json
Preload: "author","publisher","reviews"
```

Response:
```json
{
  "@id": "/books/1",
  "@type": "Book",
  "title": "The Great Gatsby",
  "author": {
    "@id": "/authors/1",
    "@type": "Author",
    "name": "F. Scott Fitzgerald"
  },
  "publisher": {
    "@id": "/publishers/1",
    "@type": "Publisher",
    "name": "Charles Scribner's Sons"
  }
}
```

### 3. Push Updates

Receive updates when data changes:

```http
GET /books/1
Accept: application/ld+json
Preload: "author"
Push: "Link: </books/1>; rel=mercure"
```

## How Speculoos Uses Vulcain

### 1. Basic Vulcain Headers

Generate Vulcain headers automatically:

```javascript
import { vulcain } from 'speculoos';

// Request specific fields
const headers = vulcain({
  fields: ['title', 'author', 'publishedAt']
});

// Request with preloaded relations
const headers = vulcain({
  fields: ['title', 'author'],
  preload: ['author']
});

// Combined request
const headers = vulcain({
  fields: ['title', 'author', 'publisher'],
  preload: ['author', 'publisher']
});

console.log(headers);
// {
//   "fields": "\"title\",\"author\",\"publisher\"",
//   "preload": "\"author\",\"publisher\""
// }
```

### 2. API Client Integration

Use Vulcain headers with API requests:

```javascript
import { ApiClient, vulcain } from 'speculoos';

const api = new ApiClient({ baseUri: 'https://api.example.com' });

// Fetch book with specific fields
const book = await api.get('/books/1', {
  headers: vulcain({
    fields: ['title', 'author', 'publishedAt']
  })
});

// Fetch collection with preloaded relations
const books = await api.get('/books', {
  headers: vulcain({
    fields: ['title', 'author'],
    preload: ['author']
  })
});
```

### 3. Store Integration

Integrate Vulcain with the Hydra plugin:

```javascript
import { createStore, HydraPlugin } from 'speculoos';

const store = await createStore({
  state: {},
  methods: {}
}).use(new HydraPlugin(api, {
  // Default Vulcain configuration
  vulcain: {
    fields: ['@id', '@type'],
    preload: []
  }
}));

// Override per-request
const book = await store.fetchItem('/books/1', {
  headers: vulcain({
    fields: ['title', 'author', 'publishedAt'],
    preload: ['author']
  })
});
```

## Advanced Usage

### 1. Dynamic Field Selection

Select fields based on context:

```javascript
const getBookFields = (context) => {
  switch (context) {
    case 'list':
      return ['title', 'author', 'publishedAt'];
    case 'detail':
      return ['title', 'author', 'publisher', 'description', 'publishedAt'];
    case 'edit':
      return ['title', 'author', 'publisher', 'description', 'publishedAt', 'isbn'];
    default:
      return ['title'];
  }
};

const fetchBooks = async (context) => {
  return await api.get('/books', {
    headers: vulcain({
      fields: getBookFields(context),
      preload: context === 'detail' ? ['author', 'publisher'] : []
    })
  });
};
```

### 2. Smart Preloading

Preload relations based on usage patterns:

```javascript
const getPreloadRelations = (resourceType, context) => {
  const preloadMap = {
    'Book': {
      'list': ['author'],
      'detail': ['author', 'publisher', 'reviews'],
      'edit': ['author', 'publisher']
    },
    'Author': {
      'list': [],
      'detail': ['books'],
      'edit': ['books']
    }
  };
  
  return preloadMap[resourceType]?.[context] || [];
};

const fetchResource = async (iri, context = 'detail') => {
  const resourceType = getResourceType(iri);
  const headers = vulcain({
    fields: getDefaultFields(resourceType, context),
    preload: getPreloadRelations(resourceType, context)
  });
  
  return await api.get(iri, { headers });
};
```

### 3. Conditional Preloading

Preload only when needed:

```javascript
const fetchBookWithConditionalPreload = async (bookId, includeAuthor = false) => {
  const config = {
    fields: ['title', 'publishedAt']
  };
  
  if (includeAuthor) {
    config.preload = ['author'];
    config.fields.push('author');
  }
  
  return await api.get(`/books/${bookId}`, {
    headers: vulcain(config)
  });
};
```

### 4. Batch Optimization

Optimize multiple requests:

```javascript
const fetchBooksWithAuthors = async (bookIds) => {
  // Fetch books with author preloading
  const books = await Promise.all(
    bookIds.map(id => 
      api.get(`/books/${id}`, {
        headers: vulcain({
          fields: ['title', 'author'],
          preload: ['author']
        })
      })
    )
  );
  
  return books;
};

// Alternative: Use collection endpoint with preloading
const fetchBooksCollection = async () => {
  return await api.get('/books', {
    headers: vulcain({
      fields: ['title', 'author'],
      preload: ['author']
    })
  });
};
```

## Performance Optimization

### 1. Field Analysis

Analyze which fields are actually used:

```javascript
const fieldUsageTracker = {
  fields: new Map(),
  
  track(field, context) {
    const key = `${field}:${context}`;
    this.fields.set(key, (this.fields.get(key) || 0) + 1);
  },
  
  getOptimalFields(context) {
    return Array.from(this.fields.entries())
      .filter(([key]) => key.endsWith(`:${context}`))
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10) // Top 10 fields
      .map(([key]) => key.split(':')[0]);
  }
};

// Track field usage in components
const useBook = (book, context) => {
  fieldUsageTracker.track('title', context);
  fieldUsageTracker.track('author', context);
  fieldUsageTracker.track('publishedAt', context);
  
  return { book };
};
```

### 2. Adaptive Preloading

Adapt preloading based on user behavior:

```javascript
const adaptivePreloader = {
  userPatterns: new Map(),
  
  recordAccess(userId, resourceType, relation) {
    const key = `${userId}:${resourceType}`;
    if (!this.userPatterns.has(key)) {
      this.userPatterns.set(key, new Map());
    }
    
    const patterns = this.userPatterns.get(key);
    patterns.set(relation, (patterns.get(relation) || 0) + 1);
  },
  
  getRecommendedPreloads(userId, resourceType) {
    const key = `${userId}:${resourceType}`;
    const patterns = this.userPatterns.get(key);
    
    if (!patterns) return [];
    
    return Array.from(patterns.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3) // Top 3 relations
      .map(([relation]) => relation);
  }
};

// Use in API calls
const fetchPersonalizedBook = async (bookId, userId) => {
  const recommendedPreloads = adaptivePreloader.getRecommendedPreloads(userId, 'Book');
  
  return await api.get(`/books/${bookId}`, {
    headers: vulcain({
      fields: ['title', 'author', 'publishedAt'],
      preload: recommendedPreloads
    })
  });
};
```

### 3. Caching Strategy

Implement intelligent caching with Vulcain:

```javascript
const vulcainCache = {
  cache: new Map(),
  
  async get(key, fetcher, vulcainConfig) {
    const cacheKey = `${key}:${JSON.stringify(vulcainConfig)}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const data = await fetcher({
      headers: vulcain(vulcainConfig)
    });
    
    this.cache.set(cacheKey, data);
    return data;
  },
  
  invalidate(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
};

// Usage
const book = await vulcainCache.get(
  '/books/1',
  (options) => api.get('/books/1', options),
  { fields: ['title', 'author'], preload: ['author'] }
);
```

## Integration with Other Features

### 1. Mercure + Vulcain

Combine real-time updates with optimized requests:

```javascript
import { useMercureSync, vulcain } from 'speculoos';

const mercureSync = useMercureSync();

// Load initial data with Vulcain optimization
const loadBooks = async () => {
  const books = await api.get('/books', {
    headers: vulcain({
      fields: ['title', 'author', 'status'],
      preload: ['author']
    })
  });
  
  // Set up real-time sync
  mercureSync.synchronize(
    books['hydra:member'],
    ['/books/{id}'],
    // Update handler - only update fields we care about
    (update, book) => {
      const allowedFields = ['title', 'author', 'status'];
      const filteredUpdate = Object.keys(update)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = update[key];
          return obj;
        }, {});
      
      Object.assign(book, filteredUpdate);
    }
  );
};
```

### 2. Filters + Vulcain

Optimize filtered requests:

```javascript
import { useFilters, vulcain } from 'speculoos';

const { filters, submit } = useFilters(() => ({
  search: new TextFilter('title'),
  author: new ItemFilter('author'),
  status: new ItemFilter('status')
}));

const fetchFilteredBooks = async () => {
  const queryParams = filters.normalize();
  
  return await api.get(`/books?${new URLSearchParams(queryParams)}`, {
    headers: vulcain({
      fields: ['title', 'author', 'status', 'publishedAt'],
      preload: ['author']
    })
  });
};
```

### 3. Pagination + Vulcain

Optimize paginated requests:

```javascript
import { createPager, vulcain } from 'speculoos';

const fetchPaginatedBooks = async (page = 1, itemsPerPage = 10) => {
  const response = await api.get(`/books?page=${page}&itemsPerPage=${itemsPerPage}`, {
    headers: vulcain({
      fields: ['title', 'author', 'publishedAt'],
      preload: ['author']
    })
  });
  
  const pager = createPager({
    currentPage: page,
    itemsPerPage,
    totalItems: response['hydra:totalItems']
  });
  
  return {
    books: response['hydra:member'],
    pager
  };
};
```

## Best Practices

### 1. Field Selection Guidelines

Choose fields wisely:

```javascript
// Good: Minimal fields for list views
const listFields = ['title', 'author', 'publishedAt'];

// Good: Comprehensive fields for detail views
const detailFields = ['title', 'author', 'publisher', 'description', 'publishedAt', 'isbn'];

// Bad: Too many fields for simple views
const excessiveFields = ['title', 'author', 'publisher', 'description', 'publishedAt', 'isbn', 'pages', 'language', 'format', 'price', 'reviews'];

// Bad: Too few fields for complex views
const minimalFields = ['title'];
```

### 2. Preloading Strategy

Preload strategically:

```javascript
// Good: Preload commonly accessed relations
const commonPreloads = ['author'];

// Good: Preload based on view requirements
const detailPreloads = ['author', 'publisher', 'reviews'];

// Bad: Preload everything
const excessivePreloads = ['author', 'publisher', 'reviews', 'categories', 'tags', 'translations'];

// Bad: Preload rarely used relations
const rarePreloads = 'internalNotes,adminComments';
```

### 3. Performance Monitoring

Monitor Vulcain effectiveness:

```javascript
const vulcainMetrics = {
  requests: 0,
  bytesSaved: 0,
  averageResponseTime: 0,
  
  recordRequest(size, responseTime) {
    this.requests++;
    this.bytesSaved += size;
    this.averageResponseTime = 
      (this.averageResponseTime + responseTime) / 2;
  },
  
  getReport() {
    return {
      totalRequests: this.requests,
      totalBytesSaved: this.bytesSaved,
      averageResponseTime: this.averageResponseTime,
      efficiency: this.bytesSaved / this.requests
    };
  }
};

// Wrap API client to collect metrics
const apiWithMetrics = new Proxy(api, {
  get(target, prop) {
    if (prop === 'get') {
      return async (url, options) => {
        const startTime = performance.now();
        const response = await target.get(url, options);
        const endTime = performance.now();
        
        // Estimate bytes saved (simplified)
        const estimatedSize = JSON.stringify(response.data).length;
        vulcainMetrics.recordRequest(estimatedSize, endTime - startTime);
        
        return response;
      };
    }
    return target[prop];
  }
});
```

## Debugging

### 1. Header Inspection

Inspect generated headers:

```javascript
const debugVulcain = (config) => {
  const headers = vulcain(config);
  console.log('Vulcain headers:', headers);
  console.log('Config:', config);
  return headers;
};

// Usage
const book = await api.get('/books/1', {
  headers: debugVulcain({
    fields: ['title', 'author'],
    preload: ['author']
  })
});
```

### 2. Response Analysis

Analyze response efficiency:

```javascript
const analyzeResponse = (response, requestedFields) => {
  const responseData = response.data;
  const actualFields = Object.keys(responseData);
  
  const unusedFields = actualFields.filter(field => 
    !requestedFields.includes(field) && !field.startsWith('@')
  );
  
  const missingFields = requestedFields.filter(field => 
    !actualFields.includes(field)
  );
  
  console.log('Response analysis:', {
    requestedFields,
    actualFields,
    unusedFields,
    missingFields,
    efficiency: (requestedFields.length / actualFields.length * 100).toFixed(2) + '%'
  });
};

// Usage
const response = await api.get('/books/1', {
  headers: vulcain({ fields: ['title', 'author'] })
});

analyzeResponse(response, ['title', 'author']);
```

## Next Steps

To learn more about using Vulcain in Speculoos:

- [API Reference - Vulcain](../api-reference/vulcain.md) - Detailed API documentation
- [API Reference - API Client](../api-reference/api-client.md) - HTTP client integration
- [Guides - Advanced Filtering](../guides/advanced-filtering.md) - Optimizing filter requests

For more information about Vulcain itself:

- [Vulcain Documentation](https://vulcain.io/)
- [Vulcain Specification](https://github.com/dunglas/vulcain)
- [API Platform Vulcain Support](https://api-platform.com/docs/core/vulcain)