# Vulcain API Reference

The Vulcain module provides utilities for generating Vulcain headers to optimize API requests by requesting only the data you need and preloading related resources.

## Overview

The Vulcain module includes:
- **vulcain()**: Main function for generating Vulcain headers
- **Vulcain Class**: Internal class for header generation
- **Field Selection**: Request only specific properties
- **Relation Preloading**: Preload related resources in single request

## Core API

### vulcain(options?)

Generates Vulcain headers for HTTP requests.

```javascript
import { vulcain } from 'speculoos';

const headers = vulcain({
  fields: ['title', 'author', 'publishedAt'],
  preload: ['author', 'publisher']
});

// Result:
// {
//   "fields": "\"title\",\"author\",\"publishedAt\"",
//   "preload": "\"author\",\"publisher\""
// }
```

**Parameters:**
- `options` (Object, optional): Configuration object
  - `fields` (Array, optional): Properties to request
  - `preload` (Array, optional): Relations to preload

**Returns:**
- `Object`: Headers object with `fields` and `preload` properties

### Vulcain Class

Internal class for Vulcain header generation.

```javascript
import { Vulcain } from 'speculoos';

const vulcain = new Vulcain({
  fields: ['title', 'author'],
  preload: ['publisher']
});

const headers = vulcain.headers;
```

**Constructor Parameters:**
- `options` (Object, optional): Configuration options
  - `fields` (Array): Properties to include
  - `preload` (Array): Relations to preload

**Properties:**
- `headers` (Object): Generated Vulcain headers

## Usage Patterns

### 1. Basic Field Selection

Request only specific fields for resources:

```javascript
import { vulcain } from 'speculoos';

// Request only essential fields
const headers = vulcain({
  fields: ['@id', '@type', 'title', 'author']
});

const response = await api.get('/books/1', { headers });
// Response will contain only the requested fields
```

### 2. Relation Preloading

Preload related resources to avoid N+1 queries:

```javascript
import { vulcain } from 'speculoos';

// Preload author and publisher with book
const headers = vulcain({
  fields: ['title', 'publishedAt'],
  preload: ['author', 'publisher']
});

const response = await api.get('/books/1', { headers });
// Response includes book with embedded author and publisher
```

### 3. Combined Field Selection and Preloading

Combine field selection with relation preloading:

```javascript
import { vulcain } from 'speculoos';

// Request book details with preloaded relations
const headers = vulcain({
  fields: ['title', 'description', 'publishedAt', 'isbn'],
  preload: ['author', 'publisher', 'reviews', 'categories']
});

const response = await api.get('/books/1', { headers });
// Single request returns book with all related data
```

### 4. Collection Optimization

Optimize collection requests with Vulcain:

```javascript
import { vulcain } from 'speculoos';

// Request collection with optimized fields
const headers = vulcain({
  fields: ['@id', '@type', 'title', 'author', 'publishedAt'],
  preload: ['author'] // Preload author for each book
});

const response = await api.get('/books', { headers });
// Collection with preloaded authors
```

### 5. Dynamic Field Selection

Select fields based on context or user permissions:

```javascript
const getBookFields = (context, userRole) => {
  const baseFields = ['@id', '@type', 'title'];
  
  switch (context) {
    case 'list':
      return [...baseFields, 'author', 'publishedAt'];
    case 'detail':
      return [...baseFields, 'description', 'isbn', 'publisher'];
    case 'edit':
      return [...baseFields, 'description', 'isbn', 'publisher', 'categories'];
    default:
      return baseFields;
  }
};

const headers = vulcain({
  fields: getBookFields('detail', userRole),
  preload: ['author', 'publisher']
});
```

## Advanced Usage

### 1. Context-Aware Vulcain

Create context-specific Vulcain configurations:

```javascript
class ContextualVulcain {
  constructor() {
    this.contexts = {
      'book-list': {
        fields: ['@id', '@type', 'title', 'author', 'publishedAt'],
        preload: ['author']
      },
      'book-detail': {
        fields: ['@id', '@type', 'title', 'description', 'isbn', 'author', 'publisher', 'publishedAt'],
        preload: ['author', 'publisher', 'reviews']
      },
      'author-detail': {
        fields: ['@id', '@type', 'name', 'bio', 'books'],
        preload: ['books']
      }
    };
  }
  
  getHeaders(context) {
    const config = this.contexts[context] || this.contexts['default'];
    return vulcain(config);
  }
  
  getListHeaders() {
    return this.getHeaders('book-list');
  }
  
  getDetailHeaders() {
    return this.getHeaders('book-detail');
  }
}

const contextualVulcain = new ContextualVulcain();
```

### 2. Permission-Based Field Selection

Select fields based on user permissions:

```javascript
class PermissionBasedVulcain {
  constructor(userPermissions) {
    this.permissions = userPermissions;
  }
  
  getHeaders(baseFields, preloadRelations) {
    const allowedFields = baseFields.filter(field => 
      this.isFieldAllowed(field)
    );
    
    const allowedPreloads = preloadRelations.filter(relation => 
      this.isRelationAllowed(relation)
    );
    
    return vulcain({
      fields: allowedFields,
      preload: allowedPreloads
    });
  }
  
  isFieldAllowed(field) {
    // Check field permissions
    const fieldPermissions = {
      'title': 'read:books.title',
      'description': 'read:books.description',
      'isbn': 'read:books.isbn',
      'price': 'read:books.price'
    };
    
    const requiredPermission = fieldPermissions[field];
    return this.permissions.includes(requiredPermission);
  }
  
  isRelationAllowed(relation) {
    // Check relation permissions
    const relationPermissions = {
      'author': 'read:authors',
      'publisher': 'read:publishers',
      'reviews': 'read:reviews'
    };
    
    const requiredPermission = relationPermissions[relation];
    return this.permissions.includes(requiredPermission);
  }
}

const userVulcain = new PermissionBasedVulcain(userPermissions);
```

### 3. Field Analysis and Optimization

Analyze and optimize field usage:

```javascript
class FieldAnalyzer {
  constructor() {
    this.usage = new Map();
    this.frequency = new Map();
  }
  
  recordUsage(fields, context) {
    const key = `${context}:${fields.join(',')}`;
    
    if (!this.usage.has(key)) {
      this.usage.set(key, {
        fields: [...fields],
        count: 0,
        contexts: new Set()
      });
    }
    
    const usage = this.usage.get(key);
    usage.count++;
    usage.contexts.add(context);
    
    // Update frequency
    fields.forEach(field => {
      this.frequency.set(
        field,
        (this.frequency.get(field) || 0) + 1
      );
    });
  }
  
  getOptimizedFields(context, maxFields = 10) {
    const contextUsage = Array.from(this.usage.values())
      .filter(usage => usage.contexts.has(context));
    
    if (contextUsage.length === 0) {
      return this.getMostFrequentFields(maxFields);
    }
    
    // Find most common field combination for context
    const sortedUsage = contextUsage
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 combinations
    
    // Return fields from most used combination
    return sortedUsage[0]?.fields || this.getMostFrequentFields(maxFields);
  }
  
  getMostFrequentFields(count) {
    return Array.from(this.frequency.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, count)
      .map(([field]) => field);
  }
}

const fieldAnalyzer = new FieldAnalyzer();
```

### 4. Cache-Aware Vulcain

Integrate caching with Vulcain requests:

```javascript
class VulcainCache {
  constructor(ttl = 300000) { // 5 minutes
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  async getWithVulcain(url, vulcainOptions, fetcher) {
    const cacheKey = `${url}:${JSON.stringify(vulcainOptions)}`;
    
    // Check cache
    const cached = this.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Fetch with Vulcain headers
    const headers = vulcain(vulcainOptions);
    const response = await fetcher(url, { headers });
    
    // Cache successful response
    if (response.ok) {
      this.set(cacheKey, response);
    }
    
    return response;
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
```

### 5. Batch Vulcain Requests

Combine multiple requests with optimized Vulcain headers:

```javascript
class BatchVulcain {
  constructor() {
    this.pendingRequests = new Map();
  }
  
  async batchRequest(requests) {
    // Analyze all requested fields and relations
    const allFields = new Set();
    const allPreloads = new Set();
    
    requests.forEach(({ fields, preload }) => {
      fields?.forEach(field => allFields.add(field));
      preload?.forEach(relation => allPreloads.add(relation));
    });
    
    // Create optimized batch request
    const optimizedFields = Array.from(allFields);
    const optimizedPreloads = Array.from(allPreloads);
    
    const headers = vulcain({
      fields: optimizedFields,
      preload: optimizedPreloads
    });
    
    // Execute batch request
    return this.executeBatch(requests, headers);
  }
  
  async executeBatch(requests, headers) {
    // Implementation depends on API capabilities
    // This is a conceptual example
    const results = await Promise.all(
      requests.map(({ url }) => api.get(url, { headers }))
    );
    
    return results;
  }
}
```

## Integration Patterns

### 1. With API Client

Integrate Vulcain headers with API requests:

```javascript
import { ApiClient, vulcain } from 'speculoos';

class VulcainApiClient extends ApiClient {
  constructor(baseUri, defaultVulcainOptions = {}) {
    super(baseUri);
    this.defaultVulcainOptions = defaultVulcainOptions;
  }
  
  async get(url, options = {}) {
    const vulcainOptions = {
      ...this.defaultVulcainOptions,
      ...options.vulcain
    };
    
    const headers = {
      ...options.headers,
      ...vulcain(vulcainOptions)
    };
    
    return super.get(url, { ...options, headers });
  }
  
  async post(url, data, options = {}) {
    const vulcainOptions = {
      ...this.defaultVulcainOptions,
      ...options.vulcain
    };
    
    const headers = {
      ...options.headers,
      ...vulcain(vulcainOptions)
    };
    
    return super.post(url, data, { ...options, headers });
  }
}

const api = new VulcainApiClient('https://api.example.com', {
  fields: ['@id', '@type', 'title'],
  preload: []
});
```

### 2. With Store/Hydra Plugin

Integrate with Hydra plugin for automatic optimization:

```javascript
import { createStore, HydraPlugin } from 'speculoos';
import { vulcain } from 'speculoos';

const store = await createStore({
  state: {},
  methods: {}
}).use(new HydraPlugin(api, {
  // Default Vulcain configuration for all requests
  vulcain: {
    fields: ['@id', '@type', 'title', 'author'],
    preload: ['author']
  }
}));

// Override per-request
const book = await store.fetchItem('/books/1', {
  vulcain: {
    fields: ['@id', '@type', 'title', 'description', 'isbn'],
    preload: ['author', 'publisher', 'reviews']
  }
});
```

### 3. With Vue Router

Integrate Vulcain with route-based optimization:

```javascript
import { useRoute, useRouter } from 'vue-router';
import { vulcain } from 'speculoos';

export function useRouteBasedVulcain() {
  const route = useRoute();
  const router = useRouter();
  
  const getVulcainHeaders = (additionalOptions = {}) => {
    // Determine fields based on route
    const routeConfig = getRouteVulcainConfig(route.name);
    
    const headers = vulcain({
      ...routeConfig,
      ...additionalOptions
    });
    
    return headers;
  };
  
  const navigateWithVulcain = (to, options = {}) => {
    const headers = getVulcainHeaders(options.vulcain);
    
    return router.push({
      ...to,
      query: {
        ...to.query,
        ...headers // Add Vulcain params to query for debugging
      }
    });
  };
  
  return {
    getVulcainHeaders,
    navigateWithVulcain
  };
}

function getRouteVulcainConfig(routeName) {
  const configs = {
    'books-list': {
      fields: ['@id', '@type', 'title', 'author', 'publishedAt'],
      preload: ['author']
    },
    'books-detail': {
      fields: ['@id', '@type', 'title', 'description', 'isbn', 'author', 'publisher', 'publishedAt'],
      preload: ['author', 'publisher', 'reviews']
    },
    'authors-detail': {
      fields: ['@id', '@type', 'name', 'bio', 'books'],
      preload: ['books']
    }
  };
  
  return configs[routeName] || {};
}
```

## Performance Considerations

### 1. Field Selection Optimization

Choose fields strategically to minimize payload size:

```javascript
// Good: Minimal fields for list views
const listViewFields = ['@id', '@type', 'title', 'author'];

// Good: Comprehensive fields for detail views
const detailViewFields = ['@id', '@type', 'title', 'description', 'isbn', 'author', 'publisher'];

// Bad: Too many fields for simple views
const excessiveFields = ['@id', '@type', 'title', 'description', 'isbn', 'author', 'publisher', 'reviews', 'categories', 'tags', 'metadata'];
```

### 2. Preload Strategy

Preload relations based on usage patterns:

```javascript
const getPreloadStrategy = (context, userRole) => {
  const strategies = {
    'book-list': {
      // Preload author (always needed for display)
      preload: ['author'],
      // Don't preload reviews (only needed on detail)
      skip: ['reviews']
    },
    'book-detail': {
      // Preload all relations for detail view
      preload: ['author', 'publisher', 'reviews', 'categories'],
      // No skips for detail view
      skip: []
    },
    'book-edit': {
      // Preload for editing (need all relations)
      preload: ['author', 'publisher', 'categories'],
      // Skip reviews (not needed for editing)
      skip: ['reviews']
    }
  };
  
  return strategies[context] || { preload: [], skip: [] };
};
```

### 3. Caching Strategy

Cache responses based on Vulcain parameters:

```javascript
class VulcainCache {
  constructor() {
    this.cache = new Map();
  }
  
  getCacheKey(url, vulcainOptions) {
    // Create cache key based on URL and Vulcain parameters
    const vulcainHash = JSON.stringify(vulcainOptions || {});
    return `${url}:${vulcainHash}`;
  }
  
  get(url, vulcainOptions) {
    const cacheKey = this.getCacheKey(url, vulcainOptions);
    return this.cache.get(cacheKey);
  }
  
  set(url, vulcainOptions, data) {
    const cacheKey = this.getCacheKey(url, vulcainOptions);
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }
  
  // Cache invalidation
  invalidate(pattern) {
    for (const [key] of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}
```

### 4. Request Batching

Batch multiple optimized requests:

```javascript
class VulcainBatcher {
  constructor(batchSize = 10, delay = 100) {
    this.batchSize = batchSize;
    this.delay = delay;
    this.pending = [];
    this.timer = null;
  }
  
  addRequest(request) {
    this.pending.push(request);
    
    if (this.pending.length >= this.batchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.delay);
    }
  }
  
  async flush() {
    if (this.pending.length === 0) return;
    
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    const requests = this.pending.splice(0, this.batchSize);
    
    // Optimize batch request
    const optimized = this.optimizeBatch(requests);
    
    // Execute batch
    const results = await this.executeBatch(optimized);
    
    return results;
  }
  
  optimizeBatch(requests) {
    // Combine fields and preloads
    const allFields = new Set();
    const allPreloads = new Set();
    
    requests.forEach(({ vulcainOptions }) => {
      vulcainOptions?.fields?.forEach(field => allFields.add(field));
      vulcainOptions?.preload?.forEach(relation => allPreloads.add(relation));
    });
    
    return {
      fields: Array.from(allFields),
      preload: Array.from(allPreloads)
    };
  }
}
```

## Testing

### 1. Header Generation Testing

```javascript
import { vulcain } from 'speculoos';

describe('Vulcain', () => {
  test('generates headers with fields only', () => {
    const headers = vulcain({
      fields: ['title', 'author']
    });
    
    expect(headers).toEqual({
      fields: '"title","author"'
    });
    expect(headers.preload).toBeUndefined();
  });
  
  test('generates headers with preload only', () => {
    const headers = vulcain({
      preload: ['author', 'publisher']
    });
    
    expect(headers.fields).toBeUndefined();
    expect(headers.preload).toBe('"author","publisher"');
  });
  
  test('generates headers with fields and preload', () => {
    const headers = vulcain({
      fields: ['title', 'author'],
      preload: ['author', 'publisher']
    });
    
    expect(headers.fields).toBe('"title","author"');
    expect(headers.preload).toBe('"author","publisher"');
  });
  
  test('handles empty options', () => {
    const headers = vulcain({});
    
    expect(headers).toEqual({});
  });
});
```

### 2. Integration Testing

```javascript
import { vulcain } from 'speculoos';

describe('Vulcain Integration', () => {
  test('integrates with API client', async () => {
    const mockApi = {
      get: jest.fn().mockResolvedValue({ data: { title: 'Test Book' } })
    };
    
    const headers = vulcain({
      fields: ['title', 'author']
    });
    
    await mockApi.get('/books/1', { headers });
    
    expect(mockApi.get).toHaveBeenCalledWith('/books/1', {
      headers: {
        'fields': '"title","author"'
      }
    });
  });
  
  test('integrates with Hydra plugin', async () => {
    const mockStore = {
      fetchItem: jest.fn().mockResolvedValue({ title: 'Test Book' })
    };
    
    const headers = vulcain({
      fields: ['title', 'author'],
      preload: ['author']
    });
    
    await mockStore.fetchItem('/books/1', { headers });
    
    expect(mockStore.fetchItem).toHaveBeenCalledWith('/books/1', {
      headers: {
        'fields': '"title","author"',
        'preload': '"author"'
      }
    });
  });
});
```

## Best Practices

### 1. Field Selection

- Request only the fields you actually need
- Use different field sets for different contexts (list vs detail)
- Avoid requesting large text fields in list views
- Consider mobile vs desktop field requirements

### 2. Relation Preloading

- Preload relations that are always displayed
- Avoid preloading large collections in list views
- Use selective preloading based on user context
- Consider the cost of preloading vs additional requests

### 3. Performance

- Measure and optimize payload sizes
- Use caching for frequently requested field combinations
- Implement request batching when appropriate
- Monitor Vulcain header effectiveness

### 4. Error Handling

- Handle partial responses gracefully
- Implement fallback for missing preloaded relations
- Validate Vulcain header support on server
- Provide clear error messages for unsupported features

## See Also

- [Core Concepts - Vulcain](../core-concepts/vulcain.md) - Vulcain concepts and usage
- [API Reference - API Client](./api-client.md) - HTTP client integration
- [API Reference - Hydra](./hydra.md) - Hydra plugin integration