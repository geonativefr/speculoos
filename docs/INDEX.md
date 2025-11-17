# Speculoos Documentation Index

This index provides a comprehensive overview of all available documentation for the Speculoos library.

## 📋 Documentation Structure

### 🚀 Getting Started
New to Speculoos? Start here to get up and running quickly.

| Document | Description | Audience |
|----------|-------------|----------|
| [Installation](./getting-started/installation.md) | Complete installation guide with environment setup | Beginners |
| [Quick Start](./getting-started/quick-start.md) | Get up and running in minutes with basic examples | Beginners |
| [First App](./getting-started/first-app.md) | Build your first complete application with Speculoos | Beginners |

### 🧠 Core Concepts
Understanding these concepts is essential for effective Speculoos development.

| Document | Description | Prerequisites |
|----------|-------------|---------------|
| [Hydra](./core-concepts/hydra.md) | Understanding Hydra and API Platform integration | Basic REST APIs |
| [Mercure](./core-concepts/mercure.md) | Real-time updates with Mercure protocol | Basic WebSockets |
| [Vulcain](./core-concepts/vulcain.md) | Optimizing API requests with Vulcain | HTTP Headers |
| [Vue 3 Reactivity](./core-concepts/vue3-reactivity.md) | Leveraging Vue 3's reactivity system | Vue 3 basics |
| [Architecture](./core-concepts/architecture.md) | Speculoos architecture and design patterns | General programming |

### 🔧 API Reference
Detailed reference documentation for all Speculoos modules.

| Module | Document | Key Features |
|--------|----------|--------------|
| [Store](./api-reference/store.md) | State management with plugin architecture | Reactive state, plugins |
| [API Client](./api-reference/api-client.md) | HTTP client with Vue 3 reactivity | Fetch wrapper, error handling |
| [Hydra](./api-reference/hydra.md) | Hydra plugin, forms, endpoints, utilities | Resource management, CRUD |
| [Mercure](./api-reference/mercure.md) | Real-time communication | Topic subscription, sync |
| [Filters](./api-reference/filters.md) | Query string filtering with Vue Router | Multiple filter types |
| [Pager](./api-reference/pager.md) | Pagination utilities | Standard/partial pagination |
| [Vulcain](./api-reference/vulcain.md) | Header generation for Vulcain | Request optimization |
| [Clone](./api-reference/clone.md) | Advanced object cloning | Circular references |

### 📚 Practical Guides
Step-by-step tutorials for common use cases and patterns.

| Guide | Description | Complexity |
|-------|-------------|------------|
| [Basic CRUD](./guides/basic-crud.md) | Create, read, update, and delete operations | Beginner |
| [Real-time Updates](./guides/real-time-updates.md) | Implementing real-time features | Intermediate |
| [Advanced Filtering](./guides/advanced-filtering.md) | Complex filtering and search | Advanced |
| [Form Handling](./guides/form-handling.md) | Working with forms and validation | Intermediate |

## 🎯 Learning Paths

### For Beginners
1. [Installation](./getting-started/installation.md)
2. [Quick Start](./getting-started/quick-start.md)
3. [First App](./getting-started/first-app.md)
4. [Vue 3 Reactivity](./core-concepts/vue3-reactivity.md)
5. [Basic CRUD](./guides/basic-crud.md)

### For Intermediate Developers
1. [Hydra](./core-concepts/hydra.md)
2. [Mercure](./core-concepts/mercure.md)
3. [Real-time Updates](./guides/real-time-updates.md)
4. [Form Handling](./guides/form-handling.md)
5. [Architecture](./core-concepts/architecture.md)

### For Advanced Developers
1. [Vulcain](./core-concepts/vulcain.md)
2. [Advanced Filtering](./guides/advanced-filtering.md)
3. Complete [API Reference](./api-reference/) for all modules
4. [Architecture](./core-concepts/architecture.md) for deep understanding

## 🔍 Quick Reference

### Common Tasks
| Task | Module | Documentation |
|------|--------|----------------|
| Setting up API client | API Client | [API Client](./api-reference/api-client.md) |
| Managing state | Store | [Store](./api-reference/store.md) |
| Working with Hydra APIs | Hydra | [Hydra](./api-reference/hydra.md) |
| Adding real-time updates | Mercure | [Mercure](./api-reference/mercure.md) |
| Filtering data | Filters | [Filters](./api-reference/filters.md) |
| Paginating results | Pager | [Pager](./api-reference/pager.md) |
| Optimizing requests | Vulcain | [Vulcain](./api-reference/vulcain.md) |
| Cloning objects | Clone | [Clone](./api-reference/clone.md) |

### Integration Examples
| Integration | Modules Involved | Guide |
|-------------|------------------|-------|
| CRUD with real-time updates | Hydra, Mercure, Store | [Real-time Updates](./guides/real-time-updates.md) |
| Advanced search with filtering | Filters, Pager, Hydra | [Advanced Filtering](./guides/advanced-filtering.md) |
| Form handling with validation | Hydra, Store, API Client | [Form Handling](./guides/form-handling.md) |

## 🛠️ Module Dependencies

```
Store (Core)
├── API Client (HTTP communication)
├── Hydra Plugin (API integration)
│   ├── Filters (Query management)
│   ├── Pager (Pagination)
│   └── Clone (Object manipulation)
├── Mercure (Real-time updates)
└── Vulcain (Request optimization)
```

## 📖 Additional Resources

### External Documentation
- [Vue 3 Documentation](https://vuejs.org/) - Vue 3 official documentation
- [API Platform](https://api-platform.com/) - API Platform documentation
- [Hydra Specification](https://www.hydra-cg.com/) - Hydra core specification
- [Mercure Protocol](https://mercure.rocks/) - Mercure protocol documentation
- [Vulcain Specification](https://vulcain.rocks/) - Vulcain protocol documentation

### Community Resources
- [GitHub Repository](https://github.com/speculoos/speculoos) - Source code and issues
- [Discord Community](https://discord.gg/speculoos) - Community chat and support
- [Examples Repository](https://github.com/speculoos/examples) - Example applications

## 🏷️ Tags

Each document is tagged with relevant topics to help you find what you need:

- **🚀** - Getting started content
- **🧠** - Core concepts and theory
- **🔧** - Technical reference documentation
- **📚** - Practical tutorials and guides
- **⚡** - Performance and optimization
- **🔒** - Security considerations
- **🧪** - Testing strategies
- **🎯** - Best practices

## 📝 Documentation Status

| Section | Status | Last Updated |
|---------|--------|--------------|
| Getting Started | ✅ Complete | 2025-11-17 |
| Core Concepts | ✅ Complete | 2025-11-17 |
| API Reference | ✅ Complete | 2025-11-17 |
| Practical Guides | ✅ Complete | 2025-11-17 |

---

**Need help?** Check our [FAQ](./FAQ.md) or open an issue on [GitHub](https://github.com/speculoos/speculoos/issues).