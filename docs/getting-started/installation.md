# Installation

This guide will help you install and configure Speculoos in your Vue 3 project.

## Prerequisites

Before installing Speculoos, make sure you have the following prerequisites:

- **Vue 3.2+** - Speculoos is built for Vue 3
- **Node.js 16+** - For package management and build tools
- **A Hydra API** - API Platform or any Hydra-compatible API

## Package Installation

### Using npm

```bash
npm install speculoos
```

### Using yarn

```bash
yarn add speculoos
```

### Using pnpm

```bash
pnpm add speculoos
```

## Peer Dependencies

Speculoos has several peer dependencies that you need to install in your project:

```bash
npm install vue@^3.2.25 vue-router@^4.0.12 @vueuse/core@^9.7.0
```

## Basic Configuration

### 1. Create API Client

```javascript
// src/api/index.js
import { ApiClient } from 'speculoos';

export const api = new ApiClient({
  baseUri: process.env.VUE_APP_API_URL || 'https://api.example.com',
  options: {
    headers: {
      'Authorization': `Bearer ${process.env.VUE_APP_API_TOKEN}`
    }
  }
});
```

### 2. Create Store with Hydra Plugin

```javascript
// src/store/index.js
import { createStore } from 'speculoos';
import { HydraPlugin } from 'speculoos';
import { api } from '../api';

export const store = await createStore({
  state: {
    // Your initial state here
    user: null,
    loading: false
  },
  methods: {
    // Your store methods here
    setUser(state, user) {
      state.user = user;
    },
    setLoading(state, loading) {
      state.loading = loading;
    }
  }
}).use(new HydraPlugin(api, {
  // Hydra plugin options
  endpoints: {
    // Custom endpoints configuration
    books: '/books',
    authors: '/authors'
  },
  classmap: {
    // Custom class mappings for Hydra types
    'Book': Book,
    'Author': Author
  }
}));

export default store;
```

### 3. Configure Mercure (Optional)

```javascript
// src/mercure/index.js
import { createMercure } from 'speculoos';

export const mercure = createMercure(
  process.env.VUE_APP_MERCURE_URL || 'https://mercure.example.com/.well-known/mercure',
  {
    // Mercure options
    withCredentials: true,
    reconnectInterval: 3000
  }
);
```

### 4. Integrate with Vue App

```javascript
// src/main.js
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import mercure from './mercure';

const app = createApp(App);

app.use(store);
app.use(router);
app.use(mercure);

app.mount('#app');
```

## Environment Variables

Create a `.env` file in your project root:

```env
# API Configuration
VUE_APP_API_URL=https://api.example.com
VUE_APP_API_TOKEN=your-api-token-here

# Mercure Configuration (optional)
VUE_APP_MERCURE_URL=https://mercure.example.com/.well-known/mercure
```

## TypeScript Support

If you're using TypeScript, create type definitions for better IDE support:

```typescript
// src/types/speculoos.d.ts
import { HydraPlugin, Mercure } from 'speculoos';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $store: ReturnType<typeof store>;
    $mercure: Mercure;
  }
}

export interface Book {
  '@id': string;
  '@type': 'Book';
  id: number;
  title: string;
  author: string;
  publishedAt: string;
}

export interface Author {
  '@id': string;
  '@type': 'Author';
  id: number;
  name: string;
  books: Book[];
}
```

## Vite Configuration

If you're using Vite, update your `vite.config.js`:

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  optimizeDeps: {
    include: ['speculoos']
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VUE_APP_API_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/mercure': {
        target: process.env.VUE_APP_MERCURE_URL,
        changeOrigin: true,
        ws: true
      }
    }
  }
});
```

## Vue CLI Configuration

If you're using Vue CLI, update your `vue.config.js`:

```javascript
// vue.config.js
module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: process.env.VUE_APP_API_URL,
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''
        }
      },
      '/mercure': {
        target: process.env.VUE_APP_MERCURE_URL,
        changeOrigin: true,
        ws: true
      }
    }
  }
};
```

## Testing Setup

For testing with Jest, configure your test environment:

```javascript
// jest.config.js
module.exports = {
  preset: '@vue/cli-plugin-unit-jest',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(speculoos|@vueuse)/)'
  ]
};
```

```javascript
// tests/setup.js
import { config } from '@vue/test-utils';
import { createStore } from 'speculoos';

// Mock store for tests
config.global.plugins = [
  [createStore, {
    state: {},
    methods: {}
  }]
];
```

## Verification

To verify your installation, create a simple component:

```vue
<!-- src/components/TestSpeculoos.vue -->
<template>
  <div>
    <h1>Speculoos Installation Test</h1>
    <p v-if="loading">Loading...</p>
    <p v-else-if="error">{{ error }}</p>
    <pre v-else>{{ data }}</pre>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useStore } from 'speculoos';

const store = useStore();
const loading = ref(false);
const error = ref(null);
const data = ref(null);

onMounted(async () => {
  try {
    loading.value = true;
    // Test API connection
    const response = await store.fetchCollection('/books');
    data.value = response;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});
</script>
```

If this component loads without errors and displays data from your API, your installation is successful!

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure all peer dependencies are installed
2. **CORS Issues**: Configure your API server to allow requests from your frontend
3. **Mercure Connection**: Check that your Mercure hub is accessible and properly configured
4. **TypeScript Errors**: Add proper type definitions for your Hydra resources

### Getting Help

- Check the [API Reference](../api-reference/) for detailed module documentation
- Review the [Guides](../guides/) for practical examples
- Open an issue on the [GitHub repository](https://github.com/speculoos/speculoos)

## Next Steps

Now that you have Speculoos installed, check out these guides:

- [Quick Start](./quick-start.md) - Get up and running in minutes
- [First App](./first-app.md) - Build your first application with Speculoos
- [Core Concepts](../core-concepts/) - Understand the underlying technologies