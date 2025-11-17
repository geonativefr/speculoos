# API Client API Reference

The API Client module provides a JSON-oriented HTTP client built on top of `fetch` with Vue 3 reactivity support. It includes error handling, request deduplication, and abort controller integration.

## Overview

The API Client handles:
- HTTP requests with proper headers and error handling
- Reactive loading state management
- Request deduplication to prevent duplicate calls
- Abort controller integration for cancellable requests
- Automatic JSON parsing and response transformation

## Core API

### ApiClient Class

Creates a new API client instance.

```javascript
import { ApiClient } from 'speculoos';

const api = new ApiClient({
  baseUri: 'https://api.example.com',
  options: {
    headers: {
      'Authorization': 'Bearer token',
      'Content-Type': 'application/json'
    }
  },
  fetcher: customFetchFunction // Optional
});
```

**Parameters:**
- `config` (Object): Configuration object
  - `baseUri` (String, optional): Base URL for all requests
  - `options` (Object, optional): Default request options
  - `fetcher` (Function, optional): Custom fetch implementation

**Instance Properties:**
- `baseUri` (String): Base URL for requests
- `options` (Object): Default request options
- `fetch` (Function): Fetch implementation

### HTTP Methods

#### get(uri, options?)

Makes a GET request.

```javascript
const response = await api.get('/books/1');
const response = await api.get('/books', {
  headers: { 'Accept': 'application/ld+json' },
  isLoading: loadingRef
});
```

**Parameters:**
- `uri` (String): Resource URI (relative to baseUri)
- `options` (Object, optional): Request options

**Returns:**
- `Promise<Response>`: HTTP response with parsed data

#### post(uri, data, options?)

Makes a POST request with JSON data.

```javascript
const book = { title: 'New Book', author: '/authors/1' };
const response = await api.post('/books', book);

const response = await api.post('/books', book, {
  headers: { 'X-Custom-Header': 'value' },
  isLoading: loadingRef,
  aborted: abortRef
});
```

**Parameters:**
- `uri` (String): Resource URI
- `data` (Any): Data to serialize as JSON
- `options` (Object, optional): Request options

**Returns:**
- `Promise<Response>`: HTTP response with parsed data

#### put(uri, data, options?)

Makes a PUT request with JSON data.

```javascript
const book = { title: 'Updated Book' };
const response = await api.put('/books/1', book);

const response = await api.put('/books/1', book, {
  isLoading: loadingRef
});
```

**Parameters:**
- `uri` (String): Resource URI
- `data` (Any): Data to serialize as JSON
- `options` (Object, optional): Request options

**Returns:**
- `Promise<Response>`: HTTP response with parsed data

#### delete(uri, options?)

Makes a DELETE request.

```javascript
const response = await api.delete('/books/1');

const response = await api.delete('/books/1', {
  isLoading: loadingRef
});
```

**Parameters:**
- `uri` (String): Resource URI
- `options` (Object, optional): Request options

**Returns:**
- `Promise<Response>`: HTTP response with parsed data

### Utility Methods

#### resolve(uri)

Resolves a URI relative to the baseUri.

```javascript
const fullUrl = api.resolve('/books/1');
// Returns: 'https://api.example.com/books/1'

const fullUrl = api.resolve('https://other-api.com/books/1');
// Returns: 'https://other-api.com/books/1'
```

**Parameters:**
- `uri` (String): URI to resolve

**Returns:**
- `String`: Resolved absolute URL

#### mergeOptions(...options)

Merges multiple option objects with intelligent header handling.

```javascript
const merged = api.mergeOptions(
  { headers: { 'Authorization': 'Bearer token' } },
  { headers: { 'Content-Type': 'application/json' } },
  { method: 'POST' }
);
```

**Parameters:**
- `...options` (Object): Option objects to merge

**Returns:**
- `Object`: Merged options object

## Request Options

### Reactive Options

The API client supports Vue 3 reactive refs for automatic state management:

```javascript
import { ref } from 'vue';

const loading = ref(false);
const aborted = ref(false);

// Automatic loading state management
await api.get('/books', {
  isLoading: loading // loading.value will be true during request
});

// Automatic abort handling
await api.get('/books', {
  aborted: aborted // Request will abort when aborted.value becomes true
});
```

### Header Options

Headers can be provided as objects or Headers instances:

```javascript
// Object headers
await api.get('/books', {
  headers: {
    'Authorization': 'Bearer token',
    'Accept': 'application/ld+json'
  }
});

// Headers instance
const headers = new Headers({
  'Authorization': 'Bearer token',
  'Accept': 'application/ld+json'
});

await api.get('/books', { headers });
```

### Abort Options

Control request cancellation:

```javascript
import { ref } from 'vue';

const aborted = ref(false);

// Set up abort condition
const cancelRequest = () => {
  aborted.value = true;
};

// Request will be cancelled when aborted.value becomes true
try {
  await api.get('/books', { aborted });
} catch (error) {
  if (error instanceof AbortError) {
    console.log('Request was cancelled');
  }
}
```

## Response Enhancement

The API client enhances responses with additional properties:

### Response Properties

```javascript
const response = await api.get('/books/1');

console.log(response.data);     // Parsed JSON data
console.log(response.json());     // Promise that resolves to data
console.log(response.status);    // HTTP status code
console.log(response.statusText);  // HTTP status text
console.log(response.headers);   // Response headers
```

### Automatic JSON Parsing

Responses are automatically parsed as JSON when possible:

```javascript
// JSON response
const response = await api.get('/books/1');
console.log(response.data); // Parsed object

// Non-JSON response
const response = await api.get('/health');
console.log(response.data); // Raw text
```

## Error Handling

### Built-in Error Classes

#### HttpError

Thrown for HTTP error responses (4xx, 5xx).

```javascript
import { HttpError } from 'speculoos';

try {
  await api.get('/nonexistent');
} catch (error) {
  if (error instanceof HttpError) {
    console.log('HTTP Error:', error.response.status);
    console.log('Response data:', error.response.data);
  }
}
```

**Properties:**
- `response` (Object): Full HTTP response
- `statusCode` (Number): HTTP status code
- `message` (String): Error message

#### AbortError

Thrown when requests are aborted.

```javascript
import { AbortError } from 'speculoos';

try {
  await api.get('/books', { aborted: abortRef });
} catch (error) {
  if (error instanceof AbortError) {
    console.log('Request aborted:', error.reason);
  }
}
```

**Properties:**
- `reason` (Any): Reason for abort

### Error Guard

The API client includes automatic error checking:

```javascript
// HttpError.guard() throws for error responses
const response = await api.get('/books');
// If response.status >= 400, HttpError is thrown automatically
```

## Request Deduplication

### withoutDuplicates()

Creates a fetch wrapper that prevents duplicate identical requests.

```javascript
import { withoutDuplicates } from 'speculoos';

const deduplicatedFetch = withoutDuplicates();

const api = new ApiClient({
  baseUri: 'https://api.example.com',
  fetcher: deduplicatedFetch
});

// Multiple identical requests will share the same promise
const promise1 = api.get('/books');
const promise2 = api.get('/books'); // Returns same promise as promise1
```

**Parameters:**
- `fetcher` (Function, optional): Custom fetch implementation

**Returns:**
- `Function`: Fetch wrapper with deduplication

### How Deduplication Works

Requests are considered identical if they have the same:
- URL
- HTTP method
- All options (headers, body, etc.)

```javascript
// These requests will be deduplicated
api.get('/books?page=1');
api.get('/books?page=1');

// These requests will NOT be deduplicated (different URLs)
api.get('/books?page=1');
api.get('/books?page=2');

// These requests will NOT be deduplicated (different options)
api.get('/books', { headers: { 'X-Version': '1' } });
api.get('/books', { headers: { 'X-Version': '2' } });
```

## Advanced Usage

### 1. Custom Fetch Implementation

Use a custom fetch function for special requirements:

```javascript
const customFetch = async (url, options) => {
  // Add custom logging
  console.log(`Request: ${options.method} ${url}`);
  
  // Add custom headers
  const customOptions = {
    ...options,
    headers: {
      ...options.headers,
      'X-Request-ID': generateRequestId(),
      'X-Client-Version': '1.0.0'
    }
  };
  
  try {
    const response = await fetch(url, customOptions);
    
    // Custom response processing
    if (response.status === 401) {
      // Handle authentication
      await refreshToken();
      // Retry request
      return fetch(url, customOptions);
    }
    
    return response;
  } catch (error) {
    // Custom error handling
    console.error('Request failed:', error);
    throw error;
  }
};

const api = new ApiClient({
  baseUri: 'https://api.example.com',
  fetcher: customFetch
});
```

### 2. Request Interceptors

Add request/response interceptors:

```javascript
class InterceptorPlugin {
  constructor(requestInterceptor, responseInterceptor) {
    this.requestInterceptor = requestInterceptor;
    this.responseInterceptor = responseInterceptor;
  }
  
  install(api) {
    const originalRequest = api.request.bind(api);
    
    api.request = async (method, url, options) => {
      // Intercept request
      let interceptedOptions = options;
      if (this.requestInterceptor) {
        interceptedOptions = this.requestInterceptor(method, url, options);
      }
      
      // Make request
      const response = await originalRequest(method, url, interceptedOptions);
      
      // Intercept response
      if (this.responseInterceptor) {
        return this.responseInterceptor(response);
      }
      
      return response;
    };
  }
}

// Usage
const api = new ApiClient({ baseUri: 'https://api.example.com' })
  .use(new InterceptorPlugin(
    // Request interceptor
    (method, url, options) => {
      console.log(`Making ${method} request to ${url}`);
      return {
        ...options,
        headers: {
          ...options.headers,
          'X-Timestamp': Date.now().toString()
        }
      };
    },
    // Response interceptor
    (response) => {
      console.log(`Received response with status ${response.status}`);
      return response;
    }
  ));
```

### 3. Retry Logic

Implement automatic retry for failed requests:

```javascript
class RetryPlugin {
  constructor(maxRetries = 3, delay = 1000) {
    this.maxRetries = maxRetries;
    this.delay = delay;
  }
  
  install(api) {
    const originalRequest = api.request.bind(api);
    
    api.request = async (method, url, options) => {
      let lastError;
      
      for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
        try {
          return await originalRequest(method, url, options);
        } catch (error) {
          lastError = error;
          
          // Don't retry on client errors (4xx)
          if (error.statusCode >= 400 && error.statusCode < 500) {
            throw error;
          }
          
          // Don't retry on last attempt
          if (attempt === this.maxRetries) {
            throw error;
          }
          
          // Wait before retry
          await new Promise(resolve => 
            setTimeout(resolve, this.delay * Math.pow(2, attempt))
          );
        }
      }
      
      throw lastError;
    };
  }
}

const api = new ApiClient({ baseUri: 'https://api.example.com' })
  .use(new RetryPlugin(3, 1000)); // 3 retries with exponential backoff
```

### 4. Progress Tracking

Track upload/download progress:

```javascript
class ProgressPlugin {
  constructor(onProgress) {
    this.onProgress = onProgress;
  }
  
  install(api) {
    const originalRequest = api.request.bind(api);
    
    api.request = async (method, url, options) => {
      if (!options.body || method === 'GET') {
        return originalRequest(method, url, options);
      }
      
      const contentLength = new Blob([options.body]).size;
      let loaded = 0;
      
      const progressBody = new ReadableStream({
        start(controller) {
          const reader = new Response(options.body).body.getReader();
          
          function read() {
            reader.read().then(({ done, value }) => {
              if (done) {
                controller.close();
                return;
              }
              
              loaded += value.byteLength;
              this.onProgress(loaded, contentLength);
              
              controller.enqueue(value);
              read();
            });
          }
          
          read();
        }
      });
      
      return originalRequest(method, url, {
        ...options,
        body: progressBody,
        duplex: 'half'
      });
    };
  }
}

const api = new ApiClient({ baseUri: 'https://api.example.com' })
  .use(new ProgressPlugin((loaded, total) => {
    console.log(`Upload progress: ${loaded}/${total} bytes`);
  }));
```

## Performance Optimization

### 1. Connection Pooling

Reuse connections for better performance:

```javascript
class ConnectionPool {
  constructor(maxConnections = 10) {
    this.maxConnections = maxConnections;
    this.activeConnections = 0;
    this.queue = [];
  }
  
  async execute(requestFn) {
    return new Promise((resolve, reject) => {
      if (this.activeConnections < this.maxConnections) {
        this.executeRequest(requestFn, resolve, reject);
      } else {
        this.queue.push({ requestFn, resolve, reject });
      }
    });
  }
  
  executeRequest(requestFn, resolve, reject) {
    this.activeConnections++;
    
    requestFn()
      .then(resolve)
      .catch(reject)
      .finally(() => {
        this.activeConnections--;
        this.processQueue();
      });
  }
  
  processQueue() {
    if (this.queue.length > 0 && this.activeConnections < this.maxConnections) {
      const { requestFn, resolve, reject } = this.queue.shift();
      this.executeRequest(requestFn, resolve, reject);
    }
  }
}

const pool = new ConnectionPool(5);

const api = new ApiClient({
  baseUri: 'https://api.example.com',
  fetcher: (url, options) => pool.execute(() => fetch(url, options))
});
```

### 2. Response Caching

Cache responses for better performance:

```javascript
class CachePlugin {
  constructor(ttl = 300000) { // 5 minutes
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  install(api) {
    const originalGet = api.get.bind(api);
    
    api.get = async (uri, options = {}) => {
      const cacheKey = `${uri}:${JSON.stringify(options)}`;
      const cached = this.get(cacheKey);
      
      if (cached && !options.skipCache) {
        return cached;
      }
      
      const response = await originalGet(uri, options);
      
      if (response.ok && !options.skipCache) {
        this.set(cacheKey, response);
      }
      
      return response;
    };
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (item && Date.now() - item.timestamp < this.ttl) {
      return item.response;
    }
    this.cache.delete(key);
    return null;
  }
  
  set(key, response) {
    this.cache.set(key, {
      response,
      timestamp: Date.now()
    });
  }
}

const api = new ApiClient({ baseUri: 'https://api.example.com' })
  .use(new CachePlugin(600000)); // 10 minutes
```

## Testing

### 1. Mock API Client

```javascript
import { ApiClient } from 'speculoos';

// Mock fetch for testing
const mockFetch = jest.fn()
  .mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ title: 'Test Book' })
  });

const api = new ApiClient({
  baseUri: 'https://api.example.com',
  fetcher: mockFetch
});

// Test
const response = await api.get('/books/1');
expect(response.data.title).toBe('Test Book');
expect(mockFetch).toHaveBeenCalledWith(
  'https://api.example.com/books/1',
  expect.objectContaining({
    method: 'GET',
    headers: expect.objectContaining({
      'Accept': 'application/ld+json, application/json'
    })
  })
);
```

### 2. Error Testing

```javascript
import { ApiClient, HttpError } from 'speculoos';

const mockFetch = jest.fn()
  .mockResolvedValueOnce({
    ok: false,
    status: 404,
    statusText: 'Not Found',
    json: () => Promise.resolve({ error: 'Resource not found' })
  });

const api = new ApiClient({
  baseUri: 'https://api.example.com',
  fetcher: mockFetch
});

// Test error handling
await expect(api.get('/books/999')).rejects.toThrow(HttpError);

try {
  await api.get('/books/999');
} catch (error) {
  expect(error).toBeInstanceOf(HttpError);
  expect(error.statusCode).toBe(404);
  expect(error.response.data.error).toBe('Resource not found');
}
```

## Best Practices

### 1. Configuration

- Set appropriate default headers
- Use environment-specific base URIs
- Configure timeout values
- Implement proper error handling

### 2. Error Handling

- Always handle HTTP errors appropriately
- Implement retry logic for transient failures
- Provide meaningful error messages to users
- Log errors for debugging

### 3. Performance

- Use request deduplication for identical requests
- Implement caching for GET requests
- Optimize payload sizes
- Use connection pooling for high-traffic apps

## See Also

- [Core Concepts - Architecture](../core-concepts/architecture.md) - API client architecture
- [API Reference - Hydra](./hydra.md) - Hydra plugin integration
- [API Reference - Vulcain](./vulcain.md) - Request optimization