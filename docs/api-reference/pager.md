# Pager API Reference

The Pager module provides utilities for handling pagination in a flexible and user-friendly way. It supports both standard and partial pagination with various display options.

## Overview

The Pager module includes:
- **createPager()**: Factory function for creating appropriate pager instances
- **StandardPager**: Complete pagination with total items
- **PartialPager**: Pagination when total items is unknown
- **TruncatedPager**: Display subset of page numbers for UI
- **Iterator Support**: Native JavaScript iteration support

## Core API

### createPager(options)

Factory function that creates appropriate pager based on available data.

```javascript
import { createPager } from 'speculoos';

// Standard pager (when totalItems is known)
const pager = createPager({
  currentPage: 2,
  itemsPerPage: 10,
  totalItems: 150
});

// Partial pager (when totalItems is unknown)
const pager = createPager({
  currentPage: 2,
  itemsPerPage: 10,
  totalItems: null
});
```

**Parameters:**
- `options` (Object): Configuration object
  - `currentPage` (Number): Current page number (1-based)
  - `itemsPerPage` (Number): Number of items per page
  - `totalItems` (Number|null): Total number of items (null for partial)

**Returns:**
- `StandardPager|PartialPager`: Appropriate pager instance

## Pager Classes

### Base Pager

Abstract base class with common pagination functionality.

```javascript
const pager = createPager({
  currentPage: 3,
  itemsPerPage: 20,
  totalItems: 100
});

console.log(pager.currentPage); // 3
console.log(pager.itemsPerPage); // 20
console.log(pager.offset); // 40 ((3-1) * 20)
console.log(pager.previousPage); // 2
console.log(pager.nextPage); // 4
```

#### Properties

- `currentPage` (Number): Current page number
- `itemsPerPage` (Number): Items per page
- `totalItems` (Number|null): Total items (null for partial pagers)
- `previousPage` (Number): Previous page number (minimum 1)
- `nextPage` (Number|null): Next page number (null for last page)
- `lastPage` (Number): Last page number
- `offset` (Number): Zero-based offset for current page
- `pages` (Array): Array of all page numbers

#### Methods

##### isFirstPage(page?)

Check if given page is the first page.

```javascript
console.log(pager.isFirstPage()); // true for page 1
console.log(pager.isFirstPage(1)); // true
console.log(pager.isFirstPage(2)); // false
```

**Parameters:**
- `page` (Number, optional): Page to check (defaults to current page)

**Returns:**
- `Boolean`: True if page is first page

##### isPreviousPage(page?)

Check if given page is the previous page.

```javascript
console.log(pager.isPreviousPage(2)); // true when current is 3
console.log(pager.isPreviousPage(3)); // false
```

**Parameters:**
- `page` (Number): Page to check

**Returns:**
- `Boolean`: True if page is previous page

##### isCurrentPage(page?)

Check if given page is the current page.

```javascript
console.log(pager.isCurrentPage()); // true
console.log(pager.isCurrentPage(3)); // true when current is 3
```

**Parameters:**
- `page` (Number, optional): Page to check (defaults to current page)

**Returns:**
- `Boolean`: True if page is current page

##### isNextPage(page?)

Check if given page is the next page.

```javascript
console.log(pager.isNextPage(4)); // true when current is 3
console.log(pager.isNextPage(3)); // false
```

**Parameters:**
- `page` (Number): Page to check

**Returns:**
- `Boolean`: True if page is next page

##### isLastPage(page?)

Check if given page is the last page.

```javascript
console.log(pager.isLastPage()); // true for page 5 (when last is 5)
console.log(pager.isLastPage(5)); // true
```

**Parameters:**
- `page` (Number, optional): Page to check (defaults to current page)

**Returns:**
- `Boolean`: True if page is last page

##### truncate(delta, includeEdges?)

Create a truncated pager for UI display.

```javascript
const truncated = pager.truncate(2, true);
// Shows pages: 1, 2, 3, 4, 5 (current: 3, delta: 2, edges: true)

const truncated = pager.truncate(1, false);
// Shows pages: 2, 3, 4 (current: 3, delta: 1, no edges)
```

**Parameters:**
- `delta` (Number): Number of pages to show on each side of current
- `includeEdges` (Boolean, default: false): Whether to always include first and last pages

**Returns:**
- `TruncatedPager`: Truncated pager instance

### StandardPager

Complete pagination when total items count is known.

```javascript
const pager = createPager({
  currentPage: 2,
  itemsPerPage: 10,
  totalItems: 95
});

console.log(pager.totalItems); // 95
console.log(pager.lastPage); // 10 (Math.ceil(95/10))
console.log(pager.nextPage); // 3
console.log(pager.hasNextPage); // true
```

**Additional Properties:**
- `hasNextPage` (Boolean): Whether next page exists
- `hasPreviousPage` (Boolean): Whether previous page exists

### PartialPager

Pagination when total items count is unknown (common with infinite scroll).

```javascript
const pager = createPager({
  currentPage: 3,
  itemsPerPage: 10,
  totalItems: null // Unknown total
});

console.log(pager.nextPage); // 4 (always assumes there's a next page)
console.log(pager.lastPage); // 4 (same as next)
console.log(pager.hasNextPage); // true (always true for partial)
```

**Behavior Differences:**
- `lastPage` equals `nextPage` (assumes more pages exist)
- `hasNextPage` is always `true`
- `isLastPage()` checks against `nextPage`

### TruncatedPager

Display subset of pages for better UI navigation.

```javascript
const pager = createPager({
  currentPage: 7,
  itemsPerPage: 10,
  totalItems: 100
});

const truncated = pager.truncate(2, true);
// Pages shown: 1, 5, 6, 7, 8, 9, 10
// (current: 7, delta: 2, with edges)
```

**Constructor:**
- `pager` (Pager): Base pager instance
- `delta` (Number): Pages to show on each side
- `includeEdges` (Boolean): Include first and last pages

**Custom Page Display Logic:**
- Always includes current page
- Includes pages within delta range of current
- Optionally includes first and last pages
- Removes duplicates while preserving order

## Iterator Support

All pager classes support native JavaScript iteration:

```javascript
const pager = createPager({
  currentPage: 1,
  itemsPerPage: 10,
  totalItems: 50
});

// Iterate through all pages
for (const page of pager) {
  console.log(page); // 1, 2, 3, 4, 5
}

// Convert to array
const pagesArray = Array.from(pager);
console.log(pagesArray); // [1, 2, 3, 4, 5]

// Use spread operator
const pagesList = [...pager];
console.log(pagesList); // [1, 2, 3, 4, 5]
```

## Advanced Usage

### 1. Custom Pager Logic

Create custom pagination logic:

```javascript
class CustomPager {
  constructor({ currentPage, itemsPerPage, totalItems }) {
    this.currentPage = currentPage;
    this.itemsPerPage = itemsPerPage;
    this.totalItems = totalItems;
    
    // Custom calculations
    this.hasNextPage = currentPage < Math.ceil(totalItems / itemsPerPage);
    this.hasPreviousPage = currentPage > 1;
  }
  
  get nextPage() {
    return this.hasNextPage ? this.currentPage + 1 : null;
  }
  
  get previousPage() {
    return this.hasPreviousPage ? this.currentPage - 1 : 1;
  }
  
  get offset() {
    return (this.currentPage - 1) * this.itemsPerPage;
  }
  
  // Custom page display logic
  get visiblePages() {
    const pages = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(
      Math.ceil(this.totalItems / this.itemsPerPage),
      this.currentPage + 2
    );
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }
  
  [Symbol.iterator]() {
    let current = 1;
    const last = Math.ceil(this.totalItems / this.itemsPerPage);
    
    return {
      next() {
        if (current > last) {
          return { done: true };
        }
        return { value: current++, done: false };
      }
    };
  }
}
```

### 2. URL-based Pagination

Integrate with URL parameters:

```javascript
import { createPager } from 'speculoos';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const currentPage = computed(() => 
  parseInt(route.query.page) || 1
);

const itemsPerPage = ref(10);
const totalItems = ref(0);

const pager = computed(() => 
  createPager({
    currentPage: currentPage.value,
    itemsPerPage: itemsPerPage.value,
    totalItems: totalItems.value
  })
);

const goToPage = (page) => {
  router.push({
    query: { ...route.query, page }
  });
};
```

### 3. API Integration

Integrate with API requests:

```javascript
import { createPager } from 'speculoos';

class PaginatedCollection {
  constructor(endpoint, itemsPerPage = 10) {
    this.endpoint = endpoint;
    this.itemsPerPage = itemsPerPage;
    this.currentPage = 1;
    this.totalItems = 0;
    this.items = [];
  }
  
  async loadPage(page = this.currentPage) {
    const offset = (page - 1) * this.itemsPerPage;
    const url = `${this.endpoint}?page=${page}&itemsPerPage=${this.itemsPerPage}`;
    
    const response = await api.get(url);
    this.items = response.data['hydra:member'];
    this.totalItems = response.data['hydra:totalItems'];
    this.currentPage = page;
    
    return this.items;
  }
  
  get pager() {
    return createPager({
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage,
      totalItems: this.totalItems
    });
  }
  
  async nextPage() {
    if (this.pager.hasNextPage) {
      return this.loadPage(this.currentPage + 1);
    }
  }
  
  async previousPage() {
    if (this.pager.hasPreviousPage) {
      return this.loadPage(this.currentPage - 1);
    }
  }
}

// Usage
const books = new PaginatedCollection('/books', 20);
await books.loadPage(1);
console.log(books.pager);
```

### 4. Infinite Scroll Pagination

Implement infinite scroll with partial pagination:

```javascript
class InfiniteScrollCollection {
  constructor(endpoint, itemsPerPage = 20) {
    this.endpoint = endpoint;
    this.itemsPerPage = itemsPerPage;
    this.items = [];
    this.currentPage = 1;
    this.hasMore = true;
  }
  
  async loadMore() {
    if (!this.hasMore) return;
    
    const offset = (this.currentPage - 1) * this.itemsPerPage;
    const url = `${this.endpoint}?offset=${offset}&limit=${this.itemsPerPage}`;
    
    const response = await api.get(url);
    const newItems = response.data['hydra:member'];
    
    if (newItems.length < this.itemsPerPage) {
      this.hasMore = false;
    }
    
    this.items.push(...newItems);
    this.currentPage++;
    
    return newItems;
  }
  
  get pager() {
    return createPager({
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage,
      totalItems: null // Partial pagination
    });
  }
}
```

### 5. Cached Pagination

Cache pages for better performance:

```javascript
class CachedPaginatedCollection {
  constructor(endpoint, itemsPerPage = 10) {
    this.endpoint = endpoint;
    this.itemsPerPage = itemsPerPage;
    this.cache = new Map();
    this.totalItems = 0;
  }
  
  async getPage(page) {
    if (this.cache.has(page)) {
      return this.cache.get(page);
    }
    
    const offset = (page - 1) * this.itemsPerPage;
    const url = `${this.endpoint}?page=${page}&itemsPerPage=${this.itemsPerPage}`;
    
    const response = await api.get(url);
    const items = response.data['hydra:member'];
    
    // Cache the result
    this.cache.set(page, items);
    
    // Update total items if not set
    if (this.totalItems === 0) {
      this.totalItems = response.data['hydra:totalItems'];
    }
    
    return items;
  }
  
  get pager() {
    return createPager({
      currentPage: 1, // Current page from cache
      itemsPerPage: this.itemsPerPage,
      totalItems: this.totalItems
    });
  }
  
  clearCache() {
    this.cache.clear();
  }
}
```

## UI Components

### 1. Pagination Component

Vue component for pagination navigation:

```vue
<template>
  <div class="pagination" v-if="pager">
    <button 
      @click="goToPage(pager.firstPage)"
      :disabled="pager.isFirstPage()"
      class="page-btn first"
    >
      First
    </button>
    
    <button 
      @click="goToPage(pager.previousPage)"
      :disabled="!pager.hasPreviousPage"
      class="page-btn prev"
    >
      Previous
    </button>
    
    <button 
      v-for="page in truncatedPages"
      :key="page"
      @click="goToPage(page)"
      :class="['page-btn', { active: pager.isCurrentPage(page) }]"
      :disabled="pager.isCurrentPage(page)"
    >
      {{ page }}
    </button>
    
    <button 
      @click="goToPage(pager.nextPage)"
      :disabled="!pager.hasNextPage"
      class="page-btn next"
    >
      Next
    </button>
    
    <button 
      @click="goToPage(pager.lastPage)"
      :disabled="pager.isLastPage()"
      class="page-btn last"
    >
      Last
    </button>
    
    <span class="pagination-info">
      Page {{ pager.currentPage }} of {{ pager.lastPage }}
      ({{ pager.totalItems }} total items)
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  currentPage: Number,
  itemsPerPage: Number,
  totalItems: Number
});

const emit = defineEmits(['page-changed']);

const pager = computed(() => 
  createPager({
    currentPage: props.currentPage,
    itemsPerPage: props.itemsPerPage,
    totalItems: props.totalItems
  })
);

const truncatedPages = computed(() => 
  pager.value.truncate(2, true)
);

const goToPage = (page) => {
  emit('page-changed', page);
};
</script>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 1rem 0;
}

.page-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  border-radius: 4px;
}

.page-btn:hover:not(:disabled) {
  background: #f0f0f0;
}

.page-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  margin-left: 1rem;
  color: #666;
}
</style>
```

### 2. Page Size Selector

Component for changing items per page:

```vue
<template>
  <div class="page-size-selector">
    <label for="page-size">Items per page:</label>
    <select 
      id="page-size"
      v-model="selectedSize"
      @change="changePageSize"
    >
      <option v-for="size in availableSizes" :key="size" :value="size">
        {{ size }}
      </option>
    </select>
    
    <span class="page-info">
      Showing {{ startItem }}-{{ endItem }} of {{ totalItems }}
    </span>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue';

const props = defineProps({
  currentPage: Number,
  itemsPerPage: Number,
  totalItems: Number,
  availableSizes: {
    type: Array,
    default: () => [10, 20, 50, 100]
  }
});

const emit = defineEmits(['page-size-changed']);

const selectedSize = ref(props.itemsPerPage);

const startItem = computed(() => 
  (props.currentPage - 1) * selectedSize.value + 1
);

const endItem = computed(() => 
  Math.min(
    props.currentPage * selectedSize.value,
    props.totalItems
  )
);

const changePageSize = () => {
  emit('page-size-changed', selectedSize.value);
};
</script>

<style scoped>
.page-size-selector {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1rem 0;
}

.page-size-selector select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.page-info {
  color: #666;
}
</style>
```

## Performance Optimization

### 1. Efficient Page Calculation

Optimize page number calculations:

```javascript
class OptimizedPager {
  constructor(options) {
    this.currentPage = options.currentPage;
    this.itemsPerPage = options.itemsPerPage;
    this.totalItems = options.totalItems;
    
    // Cache calculated values
    this._lastPage = null;
    this._pages = null;
  }
  
  get lastPage() {
    if (this._lastPage === null) {
      this._lastPage = Math.ceil(this.totalItems / this.itemsPerPage);
    }
    return this._lastPage;
  }
  
  get pages() {
    if (this._pages === null) {
      this._pages = Array.from(
        { length: this.lastPage },
        (_, i) => i + 1
      );
    }
    return this._pages;
  }
}
```

### 2. Lazy Page Generation

Generate page numbers only when needed:

```javascript
class LazyTruncatedPager {
  constructor(pager, delta, includeEdges) {
    this.pager = pager;
    this.delta = delta;
    this.includeEdges = includeEdges;
    this._pages = null;
  }
  
  get pages() {
    if (this._pages === null) {
      this._pages = this.generatePages();
    }
    return this._pages;
  }
  
  generatePages() {
    const pages = [];
    const current = this.pager.currentPage;
    const last = this.pager.lastPage;
    
    // Add first page if requested
    if (this.includeEdges && current > 1) {
      pages.push(1);
    }
    
    // Add pages in delta range
    for (let i = Math.max(1, current - this.delta); 
         i <= Math.min(last, current + this.delta); 
         i++) {
      pages.push(i);
    }
    
    // Add last page if requested
    if (this.includeEdges && current < last) {
      pages.push(last);
    }
    
    return [...new Set(pages)]; // Remove duplicates
  }
}
```

## Testing

### 1. Pager Testing

```javascript
import { createPager } from 'speculoos';

describe('Pager', () => {
  test('creates standard pager', () => {
    const pager = createPager({
      currentPage: 2,
      itemsPerPage: 10,
      totalItems: 100
    });
    
    expect(pager.currentPage).toBe(2);
    expect(pager.itemsPerPage).toBe(10);
    expect(pager.totalItems).toBe(100);
    expect(pager.lastPage).toBe(10);
    expect(pager.nextPage).toBe(3);
    expect(pager.previousPage).toBe(1);
    expect(pager.hasNextPage).toBe(true);
    expect(pager.hasPreviousPage).toBe(true);
  });
  
  test('creates partial pager', () => {
    const pager = createPager({
      currentPage: 2,
      itemsPerPage: 10,
      totalItems: null
    });
    
    expect(pager.currentPage).toBe(2);
    expect(pager.itemsPerPage).toBe(10);
    expect(pager.totalItems).toBeNull();
    expect(pager.nextPage).toBe(3);
    expect(pager.lastPage).toBe(3);
    expect(pager.hasNextPage).toBe(true);
    expect(pager.hasPreviousPage).toBe(true);
  });
  
  test('truncates pages correctly', () => {
    const pager = createPager({
      currentPage: 5,
      itemsPerPage: 10,
      totalItems: 100
    });
    
    const truncated = pager.truncate(2, true);
    expect(truncated.pages).toEqual([1, 3, 4, 5, 6, 7, 10]);
  });
});
```

### 2. Component Testing

```javascript
import { mount } from '@vue/test-utils';
import Pagination from './Pagination.vue';

describe('Pagination Component', () => {
  test('renders pagination controls', () => {
    const wrapper = mount(Pagination, {
      props: {
        currentPage: 2,
        itemsPerPage: 10,
        totalItems: 100
      }
    });
    
    expect(wrapper.find('.pagination').exists()).toBe(true);
    expect(wrapper.text()).toContain('Page 2 of 10');
  });
  
  test('emits page change events', async () => {
    const wrapper = mount(Pagination, {
      props: {
        currentPage: 2,
        itemsPerPage: 10,
        totalItems: 100
      }
    });
    
    await wrapper.find('.page-btn').trigger('click');
    expect(wrapper.emitted('page-changed')).toBeTruthy();
  });
});
```

## Best Practices

### 1. Pager Configuration

- Use appropriate items per page for your content
- Consider mobile vs desktop display differences
- Implement proper loading states during page transitions
- Provide clear visual feedback for current page

### 2. Performance

- Cache page data when appropriate
- Use efficient page number calculations
- Implement lazy loading for large datasets
- Minimize re-renders during navigation

### 3. User Experience

- Provide multiple navigation options (buttons, dropdowns)
- Show context about current position in dataset
- Implement keyboard navigation support
- Maintain page state during browser navigation

### 4. API Integration

- Use consistent pagination parameters
- Handle edge cases (empty results, single page)
- Implement proper error handling
- Consider prefetching adjacent pages

## See Also

- [Core Concepts - Vue 3 Reactivity](../core-concepts/vue3-reactivity.md) - Reactivity patterns
- [API Reference - Store](./store.md) - Store integration
- [API Reference - API Client](./api-client.md) - HTTP client integration