# Frequently Asked Questions

This document answers common questions about Speculoos and helps troubleshoot typical issues.

## 🚀 Getting Started

### Q: How do I install Speculoos?
**A:** Install Speculoos using npm or yarn:

```bash
npm install speculoos
# or
yarn add speculoos
```

For detailed installation instructions, see the [Installation Guide](./getting-started/installation.md).

### Q: What are the system requirements?
**A:** Speculoos requires:
- Vue 3.x
- Node.js 14.x or later
- A Hydra-compatible API (API Platform recommended)

### Q: Can I use Speculoos with Vue 2?
**A:** No, Speculoos is built specifically for Vue 3 and uses Vue 3's Composition API and reactivity system.

## 🔧 Configuration

### Q: How do I configure the API client?
**A:** Create an API client instance with your API endpoint:

```javascript
import { ApiClient } from 'speculoos';

const api = new ApiClient({ 
  baseUri: 'https://api.example.com',
  headers: {
    'Authorization': 'Bearer your-token'
  }
});
```

See the [API Client documentation](./api-reference/api-client.md) for more configuration options.

### Q: How do I set up Mercure for real-time updates?
**A:** Create a Mercure client and integrate it with your app:

```javascript
import { createMercure } from 'speculoos';

const mercure = createMercure('https://mercure.example.com/.well-known/mercure', {
  jwt: 'your-jwt-token'
});

app.use(mercure);
```

See the [Mercure documentation](./api-reference/mercure.md) for detailed setup.

## 🧠 Core Concepts

### Q: What is Hydra and why does Speculoos use it?
**A:** Hydra is a specification for building hypermedia-driven Web APIs. Speculoos uses Hydra to provide:
- Automatic resource discovery
- Self-documenting APIs
- Standardized operations
- Built-in pagination and filtering

Learn more in the [Hydra Core Concepts](./core-concepts/hydra.md).

### Q: How does Speculoos handle state management?
**A:** Speculoos provides a lightweight store with plugin architecture:

```javascript
import { createStore } from 'speculoos';

const store = createStore({
  state: {
    users: [],
    isLoading: false
  },
  methods: {
    async fetchUsers() {
      this.isLoading = true;
      this.users = await api.get('/users');
      this.isLoading = false;
    }
  }
});
```

See the [Store documentation](./api-reference/store.md) for details.

### Q: What is the difference between Mercure and WebSockets?
**A:** Mercure is built on top of Server-Sent Events (SSE) and provides:
- Simpler API than WebSockets
- Automatic reconnection
- Topic-based subscriptions
- Better integration with HTTP

WebSockets provide bidirectional communication, while Mercure is optimized for server-to-client updates.

## 🔍 Common Issues

### Q: Why am I getting CORS errors?
**A:** CORS errors occur when your frontend and backend are on different domains. Solutions:

1. **Configure your backend** to allow your frontend domain:
   ```php
   // API Platform example
   #[ApiResource(
       attributes: [
           'normalization_context' => ['groups' => ['read']],
           'denormalization_context' => ['groups' => ['write']],
           'security' => 'is_granted("ROLE_USER")',
           'openapi_context' => [
               'security' => [['bearerAuth' => []]]
           ]
       ]
   )]
   ```

2. **Use a proxy** in development:
   ```javascript
   // vite.config.js
   export default defineConfig({
     server: {
       proxy: {
         '/api': 'http://localhost:8000'
       }
     }
   });
   ```

### Q: Why aren't my real-time updates working?
**A:** Common Mercure issues:

1. **Check JWT token** - Ensure it's valid and contains required topics
2. **Verify Mercure hub URL** - Must be accessible from your frontend
3. **Check topic subscriptions** - Ensure you're subscribing to the correct topics
4. **Browser console** - Look for connection errors

```javascript
// Debug Mercure connection
mercure.addEventListener('open', () => {
  console.log('Mercure connection opened');
});

mercure.addEventListener('error', (event) => {
  console.error('Mercure error:', event);
});
```

### Q: Why is my data not updating reactively?
**A:** Common reactivity issues:

1. **Use reactive references**:
   ```javascript
   // ❌ Not reactive
   let data = [];
   
   // ✅ Reactive
   const data = ref([]);
   ```

2. **Mutate objects correctly**:
   ```javascript
   // ❌ Not reactive
   user.name = 'New Name';
   
   // ✅ Reactive
   user.value.name = 'New Name';
   ```

3. **Use computed properties** for derived state:
   ```javascript
   const filteredUsers = computed(() => {
     return users.value.filter(user => user.active);
   });
   ```

## 📚 Advanced Usage

### Q: How do I implement custom filters?
**A:** Create custom filter classes extending the base filter:

```javascript
import { Filter } from 'speculoos';

class CustomFilter extends Filter {
  constructor(name, value) {
    super(name, value);
  }
  
  toString() {
    return `${this.name}=${encodeURIComponent(this.value)}`;
  }
}

// Use in filter collection
const filters = new FilterCollection();
filters.add(new CustomFilter('custom', 'value'));
```

See the [Filters documentation](./api-reference/filters.md) for more examples.

### Q: How do I handle file uploads?
**A:** Use FormData with the API client:

```javascript
const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  
  return response.data;
};
```

### Q: How do I implement optimistic updates?
**A:** Update local state immediately, then sync with server:

```javascript
const updateItem = async (item, updates) => {
  // Optimistic update
  const originalItem = { ...item };
  Object.assign(item, updates);
  
  try {
    // Sync with server
    const response = await api.patch(`/items/${item.id}`, updates);
    Object.assign(item, response.data);
  } catch (error) {
    // Rollback on error
    Object.assign(item, originalItem);
    throw error;
  }
};
```

## 🧪 Testing

### Q: How do I test Speculoos components?
**A:** Use Vue Test Utils with Speculoos:

```javascript
import { mount } from '@vue/test-utils';
import { createStore } from 'speculoos';
import MyComponent from './MyComponent.vue';

describe('MyComponent', () => {
  it('renders correctly', async () => {
    const store = createStore({
      state: { items: [] }
    });
    
    const wrapper = mount(MyComponent, {
      global: {
        plugins: [store]
      }
    });
    
    expect(wrapper.exists()).toBe(true);
  });
});
```

### Q: How do I mock API calls in tests?
**A:** Use jest.mock or msw:

```javascript
import { renderHook, act } from '@testing-library/vue';
import { useApi } from 'speculoos';

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: 'mocked' })
  })
);

test('useApi hook', async () => {
  const { result } = renderHook(() => useApi());
  
  await act(async () => {
    await result.current.get('/test');
  });
  
  expect(fetch).toHaveBeenCalledWith('/test');
});
```

## 🔒 Security

### Q: How do I handle authentication?
**A:** Implement authentication with JWT tokens:

```javascript
const api = new ApiClient({
  baseUri: 'https://api.example.com',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});

// Refresh token on 401
api.addResponseInterceptor(
  response => response,
  async error => {
    if (error.status === 401) {
      const newToken = await refreshToken();
      localStorage.setItem('token', newToken);
      
      // Retry original request
      return api.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

### Q: How do I secure Mercure connections?
**A:** Use signed JWT tokens with topic claims:

```javascript
// Backend - generate Mercure token
const mercureToken = jwt.sign(
  {
    mercure: {
      publish: ['*'],
      subscribe: ['/users/{id}']
    }
  },
  mercureSecretKey
);

// Frontend - use token
const mercure = createMercure(mercureUrl, {
  jwt: mercureToken
});
```

## 🚀 Performance

### Q: How do I optimize API requests?
**A:** Use Vulcain for request optimization:

```javascript
import { generateVulcainHeaders } from 'speculoos';

const headers = generateVulcainHeaders({
  fields: ['id', 'title', 'author.name'],
  properties: {
    comments: {
      fields: ['id', 'content', 'author.name']
    }
  }
});

const response = await api.get('/books', { headers });
```

### Q: How do I implement efficient pagination?
**A:** Use the Pager component with partial pagination:

```javascript
import { createPager } from 'speculoos';

const pager = createPager({
  totalItems: 1000,
  itemsPerPage: 20,
  currentPage: 1,
  maxPages: 5
});

// Generate page links
const pageLinks = pager.generatePageLinks('/books');
```

## 🐛 Debugging

### Q: How do I debug reactivity issues?
**A:** Use Vue DevTools and console logging:

```javascript
import { watchEffect } from 'vue';

// Debug reactivity
watchEffect(() => {
  console.log('State changed:', {
    users: users.value,
    isLoading: isLoading.value
  });
});
```

### Q: How do I debug API requests?
**A:** Add request/response interceptors:

```javascript
api.addRequestInterceptor(config => {
  console.log('Request:', config);
  return config;
});

api.addResponseInterceptor(response => {
  console.log('Response:', response);
  return response;
});
```

## 📖 Still Need Help?

If you can't find an answer here:

1. **Check the documentation** - Browse our comprehensive guides
2. **Search GitHub issues** - Your question might already be answered
3. **Join our Discord** - Get help from the community
4. **Create an issue** - Report bugs or request features

### Useful Links

- [Documentation Index](./INDEX.md) - Complete documentation overview
- [Getting Started](./getting-started/) - New to Speculoos? Start here
- [API Reference](./api-reference/) - Detailed module documentation
- [GitHub Repository](https://github.com/speculoos/speculoos) - Source code and issues
- [Discord Community](https://discord.gg/speculoos) - Community support

---

**Found this helpful?** Consider contributing to the documentation or reporting issues to help others!