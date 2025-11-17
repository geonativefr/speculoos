# Advanced Filtering Guide

This guide demonstrates advanced filtering techniques in Speculoos, including complex filters, performance optimization, and integration with Vue Router and API requests.

## What You'll Build

An advanced book filtering system with:
- Multiple filter types and combinations
- Dynamic filter options
- Performance-optimized filtering
- Filter persistence and presets
- Advanced search functionality
- Integration with pagination and API

## Prerequisites

Before starting, ensure you have:
- Completed: [Basic CRUD Guide](./basic-crud.md)
- Understanding of [Filters API Reference](../api-reference/filters.md)
- Basic knowledge of Vue 3 Composition API

## Step 1: Advanced Filter Setup

### 1.1 Create Enhanced Filter Types

```javascript
// src/filters/advancedFilters.js
import { Filter, TextFilter, ItemFilter, DateRangeFilter } from 'speculoos';

// Multi-select filter with custom options
class MultiSelectFilter extends Filter {
  constructor(property, options = {}) {
    super(property);
    this.options = {
      multiple: true,
      separator: ',',
      ...options
    };
  }
  
  normalize() {
    if (Array.isArray(this.value)) {
      return { [this.property]: this.value.join(this.options.separator) };
    }
    return null;
  }
  
  denormalize(value) {
    if (typeof value === 'string') {
      this.value = value.split(this.options.separator).filter(v => v.trim());
    } else {
      this.value = Array.isArray(value) ? value : [value];
    }
  }
}

// Price range filter with validation
class PriceRangeFilter extends Filter {
  constructor(property, options = {}) {
    super(property);
    this.min = null;
    this.max = null;
    this.options = options;
  }
  
  setRange(min, max) {
    if (min !== null && max !== null && min <= max) {
      this.min = min;
      this.max = max;
    }
  }
  
  normalize() {
    if (this.min !== null && this.max !== null) {
      return { [this.property]: `${this.min}..${this.max}` };
    }
    return null;
  }
  
  denormalize(value) {
    const [min, max] = value.split('..').map(Number);
    
    if (!isNaN(min) && !isNaN(max) && min <= max) {
      this.setRange(min, max);
    } else {
      this.min = null;
      this.max = null;
    }
  }
  
  isValid() {
    return this.min !== null && this.max !== null;
  }
}

// Dynamic filter with async options loading
class DynamicItemFilter extends ItemFilter {
  constructor(property, optionsLoader) {
    super(property);
    this.optionsLoader = optionsLoader;
    this.loading = false;
    this.options = [];
  }
  
  async loadOptions() {
    this.loading = true;
    try {
      this.options = await this.optionsLoader();
    } finally {
      this.loading = false;
    }
  }
  
  normalize() {
    if (this.value && !this.loading) {
      return { [this.property]: this.value };
    }
    return null;
  }
  
  async denormalize(value) {
    this.value = value;
    await this.loadOptions();
  }
}
```

### 1.2 Create Advanced Filter Collection

```javascript
// src/composables/useAdvancedFilters.js
import { ref, computed } from 'vue';
import { useFilters } from 'speculoos';
import { MultiSelectFilter, PriceRangeFilter, DynamicItemFilter } from '../filters/advancedFilters';

export function useAdvancedFilters() {
  // Base filters
  const { filters, submit, clear } = useFilters(() => ({
    // Text search with options
    search: new TextFilter('title', {
      match: 'contains',
      caseSensitive: false
    }),
    
    // Multi-select categories
    categories: new MultiSelectFilter('categories', {
      separator: '|'
    }),
    
    // Price range with validation
    priceRange: new PriceRangeFilter('price', {
      validate: (min, max) => min >= 0 && max <= 1000 && min <= max
    }),
    
    // Dynamic author filter
    author: new DynamicItemFilter('author', async () => {
      const response = await fetch('/api/authors');
      return response.json();
    }),
    
    // Date range filter
    dateRange: new DateRangeFilter('publishedAt'),
    
    // Status filter
    status: new ItemFilter('status', {
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'published', label: 'Published' },
        { value: 'archived', label: 'Archived' }
      ]
    }),
    
    // Rating filter
    rating: new ItemFilter('rating', {
      options: [
        { value: 1, label: '⭐' },
        { value: 2, label: '⭐⭐' },
        { value: 3, label: '⭐⭐⭐' },
        { value: 4, label: '⭐⭐⭐⭐' },
        { value: 5, label: '⭐⭐⭐⭐⭐' }
      ]
    })
  }), {
    // Advanced options
    debounceMs: 300,
    preserveQuery: true
  });
  
  // Computed properties
  const hasActiveFilters = computed(() => {
    const normalized = filters.normalize();
    return Object.keys(normalized).length > 0;
  });
  
  const activeFiltersCount = computed(() => {
    const normalized = filters.normalize();
    return Object.keys(normalized).length;
  });
  
  const filterSummary = computed(() => {
    const normalized = filters.normalize();
    return Object.entries(normalized).map(([key, value]) => {
      const filter = filters[key];
      return `${filter.constructor.name}: ${value}`;
    });
  });
  
  // Advanced methods
  const setFilterPreset = (presetName) => {
    const presets = {
      recent: {
        search: 'javascript',
        status: 'published',
        dateRange: {
          from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          to: new Date()
        }
      },
      popular: {
        categories: ['fiction', 'science-fiction'],
        rating: '4',
        priceRange: { min: 10, max: 50 }
      },
      cheap: {
        priceRange: { min: 0, max: 10 }
      }
    };
    
    const preset = presets[presetName];
    if (preset) {
      Object.keys(preset).forEach(key => {
        if (filters[key]) {
          filters[key].value = preset[key];
        }
      });
    }
  };
  
  const clearAllFilters = () => {
    Object.keys(filters).forEach(key => {
      if (filters[key].reset) {
        filters[key].reset();
      } else {
        filters[key].value = null;
      }
    });
  };
  
  const exportFilters = () => {
    const normalized = filters.normalize();
    const queryString = new URLSearchParams(normalized).toString();
    
    // Copy to clipboard
    navigator.clipboard.writeText(window.location.origin + window.location.pathname + '?' + queryString);
    
    // Show success message
    showNotification('Filters exported to clipboard');
  };
  
  return {
    filters,
    hasActiveFilters,
    activeFiltersCount,
    filterSummary,
    setFilterPreset,
    clearAllFilters,
    submit,
    clear
  };
}
```

## Step 2: Enhanced Filter Components

### 2.1 Advanced Filter Panel

```vue
<!-- src/components/AdvancedFilterPanel.vue -->
<template>
  <div class="filter-panel">
    <h3>Advanced Filters</h3>
    
    <div class="filter-section">
      <h4>Search</h4>
      <div class="filter-controls">
        <input
          v-model="filters.search.value"
          type="text"
          placeholder="Search books..."
          class="search-input"
          @input="debouncedSearch"
        />
        <select v-model="filters.search.options.match">
          <option value="contains">Contains</option>
          <option value="starts_with">Starts with</option>
          <option value="ends_with">Ends with</option>
          <option value="exact">Exact match</option>
        </select>
        <label>
          <input
            v-model="filters.search.options.caseSensitive"
            type="checkbox"
          />
          Case sensitive
        </label>
      </div>
    </div>
    
    <div class="filter-section">
      <h4>Categories</h4>
      <div class="category-chips">
        <label 
          v-for="category in availableCategories" 
          :key="category.value"
          class="category-chip"
          :class="{ active: filters.categories.value.includes(category.value) }"
        >
          <input
            type="checkbox"
            :value="category.value"
            v-model="filters.categories.value"
          />
          {{ category.label }}
        </label>
      </div>
      
      <button @click="showAllCategories" class="btn btn-sm">
        All Categories
      </button>
    </div>
    
    <div class="filter-section">
      <h4>Price Range</h4>
      <div class="price-range">
        <div class="price-input">
          <label>Min:</label>
          <input
            type="number"
            v-model="filters.priceRange.min"
            min="0"
            :max="filters.priceRange.max"
            @input="validatePriceRange"
          />
        </div>
        
        <div class="price-input">
          <label>Max:</label>
          <input
            type="number"
            v-model="filters.priceRange.max"
            min="0"
            :max="filters.priceRange.max"
            @input="validatePriceRange"
          />
        </div>
        
        <div class="price-presets">
          <button 
            v-for="preset in pricePresets" 
            :key="preset.name"
            @click="setPricePreset(preset)"
            class="btn btn-sm"
            :class="{ active: isPricePresetActive(preset) }"
          >
            {{ preset.label }}
          </button>
        </div>
      </div>
    </div>
    
    <div class="filter-section">
      <h4>Publication Date</h4>
      <div class="date-range">
        <div class="date-input">
          <label>From:</label>
          <input
            type="date"
            v-model="filters.dateRange.from"
            :max="filters.dateRange.to"
          />
        </div>
        
        <div class="date-input">
          <label>To:</label>
          <input
            type="date"
            v-model="filters.dateRange.to"
            :min="filters.dateRange.from"
          />
        </div>
        
        <div class="date-presets">
          <button 
            v-for="preset in datePresets" 
            :key="preset.name"
            @click="setDatePreset(preset)"
            class="btn btn-sm"
            :class="{ active: isDatePresetActive(preset) }"
          >
            {{ preset.label }}
          </button>
        </div>
      </div>
    </div>
    
    <div class="filter-actions">
      <button @click="applyFilters" class="btn btn-primary" :disabled="!hasValidFilters">
        Apply Filters
      </button>
      
      <button @click="clearAllFilters" class="btn btn-secondary">
        Clear All
      </button>
      
      <div class="filter-presets">
        <button 
          v-for="preset in filterPresets" 
          :key="preset.name"
          @click="setFilterPreset(preset)"
          class="btn btn-sm"
        >
          {{ preset.name }}
        </button>
      </div>
    </div>
    
    <div v-if="hasActiveFilters" class="active-filters-summary">
      <h4>Active Filters ({{ activeFiltersCount }})</h4>
      <div class="filter-tags">
        <span 
          v-for="[key, value] in filterSummary" 
          :key="key"
          class="filter-tag"
        >
          {{ value }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAdvancedFilters } from '../composables/useAdvancedFilters';

const {
  filters,
  hasActiveFilters,
  activeFiltersCount,
  filterSummary,
  setFilterPreset,
  clearAllFilters,
  submit
} = useAdvancedFilters();

// Available categories (could be loaded from API)
const availableCategories = ref([
  { value: 'fiction', label: 'Fiction' },
  { value: 'non-fiction', label: 'Non-Fiction' },
  { value: 'science-fiction', label: 'Science Fiction' },
  { value: 'biography', label: 'Biography' },
  { value: 'history', label: 'History' },
  { value: 'technology', label: 'Technology' }
]);

// Price presets
const pricePresets = [
  { name: 'cheap', label: 'Under $10', min: 0, max: 10 },
  { name: 'moderate', label: '$10 - $50', min: 10, max: 50 },
  { name: 'expensive', label: '$50 - $100', min: 50, max: 100 }
];

// Date presets
const datePresets = [
  { name: 'last30days', label: 'Last 30 Days', days: 30 },
  { name: 'last90days', label: 'Last 90 Days', days: 90 },
  { name: 'lastyear', label: 'Last Year', days: 365 },
  { name: 'alltime', label: 'All Time', days: null }
];

// Filter presets
const filterPresets = [
  { name: 'recent', label: 'Recently Published' },
  { name: 'popular', label: 'Popular Books' },
  { name: 'highlyRated', label: 'Highly Rated' },
  { name: 'available', label: 'Available Now' }
];

// Validation
const hasValidFilters = computed(() => {
  const normalized = filters.normalize();
  
  // Check if at least one valid filter
  return Object.keys(normalized).some(key => {
    const filter = filters[key];
    if (filter.isValid && !filter.isValid()) {
      return false;
    }
    return filter.value !== null && filter.value !== '';
  });
});

// Methods
const debouncedSearch = () => {
  // Debounced search is handled in the composable
};

const validatePriceRange = () => {
  if (filters.priceRange.min !== null && filters.priceRange.max !== null) {
    if (!filters.priceRange.isValid()) {
      showNotification('Invalid price range');
    }
  }
};

const setPricePreset = (preset) => {
  filters.priceRange.setRange(preset.min, preset.max);
};

const isPricePresetActive = (preset) => {
  return filters.priceRange.min === preset.min && filters.priceRange.max === preset.max;
};

const setDatePreset = (preset) => {
  const now = new Date();
  let fromDate, toDate;
  
  if (preset.days) {
    fromDate = new Date(now.getTime() - preset.days * 24 * 60 * 60 * 1000);
    toDate = now;
  } else {
    fromDate = null;
    toDate = null;
  }
  
  filters.dateRange.from = fromDate;
  filters.dateRange.to = toDate;
};

const showAllCategories = () => {
  availableCategories.value.forEach(category => {
    filters.categories.value = category.value;
  });
};

const setFilterPreset = (preset) => {
  setFilterPreset(preset);
  
  // Apply other preset settings
  if (preset.name === 'recent') {
    filters.search.options.match = 'contains';
    filters.status.value = 'published';
    filters.dateRange.from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  }
};

const applyFilters = () => {
  submit();
};

const clearAllFilters = () => {
  clearAllFilters();
};

const showNotification = (message) => {
  // Simple notification implementation
  console.log(message);
  // In a real app, you'd use a toast library
};

onMounted(() => {
  // Load initial filter state from URL
  // This would be handled by the useFilters composable
});
</script>

<style scoped>
.filter-panel {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  max-width: 800px;
  margin: 0 auto;
}

.filter-section {
  margin-bottom: 2rem;
}

.filter-section h4 {
  margin: 0 0 1rem 0;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
}

.filter-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.category-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.category-chip {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.category-chip:hover {
  border-color: #007bff;
  background: #f8f9fa;
}

.category-chip.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.category-chip input {
  margin-right: 0.5rem;
}

.price-range {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.price-input {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.price-input label {
  margin-bottom: 0.25rem;
  font-weight: 600;
  color: #555;
}

.price-input input {
  width: 100px;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.date-range {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.date-presets {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.active-filters-summary {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-tag {
  background: #007bff;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.875rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
```

## Step 3: Performance Optimization

### 3.1 Implement Efficient Filtering

```javascript
// src/composables/useOptimizedFilters.js
import { ref, computed } from 'vue';
import { useFilters } from 'speculoos';

export function useOptimizedFilters() {
  const filterCache = new Map();
  const lastFilterState = ref(null);
  
  const { filters } = useFilters(() => ({
    search: new TextFilter('title'),
    author: new ItemFilter('author'),
    category: new MultiSelectFilter('categories')
  }), {
    // Cache filter results
    cacheKey: (filterState) => {
      return JSON.stringify(filterState);
    }
  });
  
  // Memoized filter application
  const applyFiltersOptimized = () => {
    const filterState = filters.normalize();
    
    // Check cache
    const cacheKey = cacheKey(filterState);
    if (filterCache.has(cacheKey)) {
      return filterCache.get(cacheKey);
    }
    
    // Apply filters with performance monitoring
    const startTime = performance.now();
    const result = applyFiltersFunction(filterState);
    const endTime = performance.now();
    
    // Cache result
    filterCache.set(cacheKey, {
      result,
      time: endTime - startTime
    });
    
    lastFilterState.value = filterState;
    return result;
  };
  
  // Debounced filter application
  const debouncedApply = debounce(() => {
    applyFiltersOptimized();
  }, 100);
  
  return {
    filters,
    applyFilters: debouncedApply,
    lastFilterState,
    cacheStats: computed(() => ({
      size: filterCache.size,
      hits: Array.from(filterCache.values()).reduce((sum, item) => sum + (item.hits || 0), 0)
    }))
  };
}
```

### 3.2 Virtual Scrolling for Large Datasets

```vue
<!-- src/components/VirtualBookList.vue -->
<template>
  <div class="virtual-list-container" ref="container">
    <div class="virtual-list" :style="{ height: totalHeight + 'px' }">
      <div 
        v-for="item in visibleItems" 
        :key="item.id" 
        class="virtual-item"
        :style="{ height: itemHeight + 'px' }"
      >
        <BookCard :book="item" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  itemHeight: {
    type: Number,
    default: 50
  }
});

const container = ref(null);
const scrollTop = ref(0);
const itemHeight = props.itemHeight;
const containerHeight = ref(0);

// Calculate visible items for virtual scrolling
const visibleItems = computed(() => {
  const startIndex = Math.floor(scrollTop.value / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight.value / itemHeight),
    props.items.length
  );
  
  return props.items.slice(startIndex, endIndex);
});

const totalHeight = computed(() => {
  return Math.ceil(props.items.length / 10) * itemHeight;
});

// Handle scroll events
const handleScroll = () => {
  if (container.value) {
    scrollTop.value = container.value.scrollTop;
  }
};

onMounted(() => {
  // Set up intersection observer for better performance
  if (container.value) {
    containerHeight.value = container.value.clientHeight || 500;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Load more items when needed
          loadMoreItems();
        }
      });
    });
    
    // Observe the container
    observer.observe(container.value);
  }
});

const loadMoreItems = () => {
  // In a real app, this would load more data from the API
  console.log('Loading more items...');
};

onUnmounted(() => {
  // Clean up observer
  if (container.value) {
    // Clean up intersection observer
  }
});
</script>

<style scoped>
.virtual-list-container {
  height: 500px;
  overflow: auto;
  border: 1px solid #ddd;
}

.virtual-list {
  position: relative;
}

.virtual-item {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}
</style>
```

## Step 4: API Integration

### 4.1 Optimized API Requests

```javascript
// src/api/optimizedApi.js
import { ApiClient } from 'speculoos';

class OptimizedApiClient extends ApiClient {
  constructor(baseUri, options = {}) {
    super(baseUri, {
      // Add request batching
      batchTimeout: 50,
      // Add response caching
      cacheTimeout: 300000, // 5 minutes
      ...options
    });
    
    this.pendingRequests = new Map();
    this.responseCache = new Map();
    this.batchQueue = [];
  }
  
  async get(url, options = {}) {
    // Check cache first
    const cacheKey = `${url}:${JSON.stringify(options)}`;
    if (this.responseCache.has(cacheKey)) {
      const cached = this.responseCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.options.cacheTimeout) {
        return cached.response;
      }
    }
    
    // Add to batch queue
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(cacheKey, { resolve, reject });
      this.batchQueue.push({ url, options, resolve, reject });
      
      // Process batch after timeout
      setTimeout(() => {
        this.processBatch();
      }, this.options.batchTimeout);
    });
  }
  
  async post(url, data, options = {}) {
    // Similar batching for POST requests
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(`${url}:${JSON.stringify(options)}`, { resolve, reject });
      this.batchQueue.push({ url, data, options, resolve, reject, method: 'POST' });
      
      setTimeout(() => {
        this.processBatch();
      }, this.options.batchTimeout);
    });
  }
  
  processBatch() {
    if (this.batchQueue.length === 0) return;
    
    const batch = this.batchQueue.splice(0, 10);
    
    try {
      // Process all requests in parallel
      const results = await Promise.all(
        batch.map(async ({ url, options, method = 'GET', resolve, reject }) => {
          if (method === 'GET') {
            return super.get(url, options);
          } else {
            return super.post(url, data, options);
          }
        })
      );
      
      // Resolve all pending requests
      batch.forEach(({ resolve, response }) => resolve(response));
      
      // Cache responses
      batch.forEach(({ url, options, response }) => {
        const cacheKey = `${url}:${JSON.stringify(options)}`;
        this.responseCache.set(cacheKey, {
          response,
          timestamp: Date.now()
        });
      });
    } catch (error) {
      // Reject all pending requests
      batch.forEach(({ reject }) => reject(error));
    }
  }
  
  clearCache() {
    this.responseCache.clear();
  }
}
```

### 4.2 Smart Data Loading

```javascript
// src/composables/useSmartDataLoading.js
import { ref, computed } from 'vue';

export function useSmartDataLoading(fetchFunction, options = {}) {
  const data = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const cache = new Map();
  
  // Preload related data
  const preloadRelations = async (items) => {
    const relations = new Set();
    
    items.forEach(item => {
      if (item.author) relations.add(item.author);
      if (item.publisher) relations.add(item.publisher);
    });
    
    // Fetch all unique relations in parallel
    const relationPromises = Array.from(relations).map(async (iri) => {
      if (cache.has(iri)) {
        return cache.get(iri);
      }
      
      const relation = await fetchFunction(iri);
      cache.set(iri, relation);
      return relation;
    });
    
    const resolvedRelations = await Promise.all(relationPromises);
    
    // Attach relations to items
    items.forEach(item => {
      if (item.author && cache.has(item.author)) {
        item.author = cache.get(item.author);
      }
      if (item.publisher && cache.has(item.publisher)) {
        item.publisher = cache.get(item.publisher);
      }
    });
  };
  
  const loadData = async (params) => {
    try {
      loading.value = true;
      error.value = null;
      
      const response = await fetchFunction(params);
      const items = response.data['hydra:member'] || [];
      
      // Preload relations for all items
      await preloadRelations(items);
      
      data.value = items;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };
  
  // Infinite scroll loading
  const loadMore = () => {
    if (!loading.value && hasMoreData.value) {
      loadData({
        page: currentPage.value + 1
      });
    }
  };
  
  return {
    data,
    loading,
    error,
    loadData,
    loadMore
  };
}
```

## Step 5: Advanced Features

### 5.1 Filter Persistence and Sharing

```javascript
// src/composables/usePersistedFilters.js
import { ref, computed, watch } from 'vue';

export function usePersistedFilters(storageKey = 'advancedFilters') {
  const filters = ref({});
  const presets = ref([]);
  
  // Load from localStorage
  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        filters.value = data.filters || {};
        presets.value = data.presets || [];
      }
    } catch (error) {
      console.error('Failed to load filters:', error);
    }
  };
  
  // Save to localStorage
  const saveToStorage = () => {
    try {
      const data = {
        filters: filters.value,
        presets: presets.value,
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save filters:', error);
    }
  };
  
  // Auto-save with debouncing
  let saveTimeout = null;
  const debouncedSave = () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveToStorage, 1000);
  };
  
  // Watch for changes and auto-save
  watch([filters, presets], () => {
    debouncedSave();
  }, { deep: true });
  
  // Preset management
  const savePreset = (name) => {
    const preset = {
      name,
      filters: JSON.parse(JSON.stringify(filters.value)),
      createdAt: new Date().toISOString()
    };
    
    presets.value.push(preset);
    saveToStorage();
  };
  
  const deletePreset = (index) => {
    presets.value.splice(index, 1);
    saveToStorage();
  };
  
  const loadPreset = (preset) => {
    Object.keys(preset.filters).forEach(key => {
      if (filters[key]) {
        filters[key].value = preset.filters[key];
      }
    });
  };
  
  return {
    filters,
    presets,
    savePreset,
    deletePreset,
    loadPreset,
    loadFromStorage
  };
}
```

### 5.2 Real-time Filter Updates

```javascript
// src/composables/useRealtimeFilters.js
import { ref, computed } from 'vue';
import { useMercureSync } from 'speculoos';

export function useRealtimeFilters(filterTopics) {
  const filters = ref({});
  const filterUpdates = ref([]);
  
  const { synchronize } = useMercureSync({
    removeListenersOnUnmount: true
  });
  
  // Set up real-time filter synchronization
  const setupFilterSync = (filterName) => {
    synchronize(
      [filters], // Pass the filters object
      [`${filterTopics}`], // Listen to filter updates
      // Update handler
      (update, filter) => {
        if (update && filter) {
          // Apply the update to the local filter
          Object.keys(update).forEach(key => {
            if (filter[key]) {
              filter[key].value = update[key];
            }
          });
          
          // Add to update history
          filterUpdates.value.unshift({
            filterName,
            update,
            timestamp: new Date().toISOString()
          });
        }
      }
    );
  };
  
  // Initialize filter synchronization
  const initializeFilterSync = () => {
    Object.keys(filters.value).forEach(filterName => {
      setupFilterSync(filterName);
    });
  };
  
  // Broadcast filter changes
  const broadcastFilterChange = (filterName, newValue) => {
    // In a real app, this would broadcast to other users
    const update = { [filterName]: newValue };
    mercureSync.emit('/filters/updates', update);
  };
  
  return {
    filters,
    filterUpdates,
    initializeFilterSync,
    broadcastFilterChange
  };
}
```

## Best Practices

### 1. Performance Optimization

- Use debouncing for rapid filter changes
- Implement virtual scrolling for large datasets
- Cache filter results to avoid recomputation
- Batch API requests when possible
- Use efficient data structures

### 2. User Experience

- Provide clear visual feedback for filter states
- Implement filter presets for common use cases
- Show active filter count and summary
- Allow easy filter clearing and resetting
- Implement progressive disclosure for complex filters

### 3. Code Organization

- Separate filter logic into reusable composables
- Create custom filter types for specific needs
- Use consistent naming conventions
- Document filter behavior and options
- Test filters independently of components

### 4. Testing Strategy

- Test each filter type independently
- Test filter combinations and edge cases
- Mock API responses for consistent testing
- Test performance with large datasets
- Test real-time synchronization behavior

## Next Steps

With advanced filtering implemented, you can:

1. **Add Analytics**: Track filter usage patterns and performance
2. **Add Export/Import**: Allow users to save and share filter configurations
3. **Add AI-powered Features**: Implement smart filter suggestions
4. **Add Mobile Optimization**: Optimize for touch devices and slower connections
5. **Add Accessibility**: Ensure filters work with screen readers

For more advanced patterns, see:
- [API Reference - Filters](../api-reference/filters.md) - Detailed filter API
- [Core Concepts - Vue 3 Reactivity](../core-concepts/vue3-reactivity.md) - Reactivity patterns
- [Real-time Updates Guide](./real-time-updates.md) - Live update patterns