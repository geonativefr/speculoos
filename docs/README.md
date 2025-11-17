# Speculoos Documentation

**Speculoos** is an opinionated set of components to use with Vue 3 and Hydra APIs. It provides a comprehensive toolkit for building modern web applications that interact with API Platform and other Hydra-powered APIs.

## 🚀 Quick Start

```bash
npm install speculoos
```

```javascript
import { createApp } from 'vue';
import { createStore, ApiClient, HydraPlugin, createMercure } from 'speculoos';

const app = createApp(App);

// Create API client
const api = new ApiClient({ baseUri: 'https://api.example.com' });

// Create store with Hydra plugin
const store = await createStore({
  state: {},
  methods: {}
}).use(new HydraPlugin(api));

// Create Mercure client for real-time updates
const mercure = createMercure('https://mercure.example.com/.well-known/mercure');

app.use(store);
app.use(mercure);
app.mount('#app');
```

## 📚 Documentation

### 📖 Documentation Index
- [Documentation Index](./INDEX.md) - Complete overview and navigation guide
- [FAQ](./FAQ.md) - Frequently asked questions and troubleshooting

### 🚀 Getting Started
- [Installation](./getting-started/installation.md) - How to install and configure Speculoos
- [Quick Start](./getting-started/quick-start.md) - Get up and running in minutes
- [First App](./getting-started/first-app.md) - Build your first application with Speculoos

### 🧠 Core Concepts
- [Hydra](./core-concepts/hydra.md) - Understanding Hydra and API Platform
- [Mercure](./core-concepts/mercure.md) - Real-time updates with Mercure
- [Vulcain](./core-concepts/vulcain.md) - Optimizing API requests with Vulcain
- [Vue 3 Reactivity](./core-concepts/vue3-reactivity.md) - Leveraging Vue 3's reactivity system
- [Architecture](./core-concepts/architecture.md) - Speculoos architecture and design patterns

### 🔧 API Reference
- [Store](./api-reference/store.md) - State management with plugin architecture
- [API Client](./api-reference/api-client.md) - HTTP client with Vue 3 reactivity
- [Hydra](./api-reference/hydra.md) - Hydra plugin, forms, endpoints, and utilities
- [Mercure](./api-reference/mercure.md) - Real-time communication
- [Filters](./api-reference/filters.md) - Query string filtering with Vue Router
- [Pager](./api-reference/pager.md) - Pagination utilities
- [Vulcain](./api-reference/vulcain.md) - Header generation for Vulcain
- [Clone](./api-reference/clone.md) - Advanced object cloning

### 📚 Practical Guides
- [Basic CRUD](./guides/basic-crud.md) - Create, read, update, and delete operations
- [Real-time Updates](./guides/real-time-updates.md) - Implementing real-time features
- [Advanced Filtering](./guides/advanced-filtering.md) - Complex filtering and search
- [Form Handling](./guides/form-handling.md) - Working with forms and validation

## 🧩 Components

### Store
A lightweight, extensible global state management store with plugin architecture. Provides reactive state management and integrates seamlessly with Vue 3's Composition API.

### API Client
A JSON-oriented HTTP client built on top of `fetch` with Vue 3 reactivity support. Includes error handling, request deduplication, and abort controller integration.

### Mercure
A Mercure client for real-time communication with automatic reconnection and topic subscription management.

### Hydra Plugin
A comprehensive plugin for working with Hydra APIs, including:
- Automatic resource management
- Collection handling
- Form processing
- Endpoint resolution
- IRI utilities

### Filters
Manage filters from query strings with Vue Router integration. Supports various filter types including text, date ranges, arrays, and more.

### Pager
Pagination utilities with support for both standard and partial pagination, including truncated page displays.

### Vulcain
Generate Vulcain headers for optimizing API requests and reducing data transfer.

### Clone
Advanced object cloning that preserves prototypes and supports circular references.

## 🎯 Key Features

- **Vue 3 Native**: Built specifically for Vue 3 with Composition API support
- **Hydra Ready**: Full support for Hydra/API Platform APIs
- **Real-time**: Integrated Mercure support for live updates
- **Type-safe**: TypeScript-friendly design patterns
- **Modular**: Use only what you need with a plugin-based architecture
- **Reactive**: Deep integration with Vue 3's reactivity system
- **Performance Optimized**: Request deduplication, smart caching, and efficient updates

## 🤝 Contributing

We welcome contributions! Please see our [contributing guidelines](../CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.