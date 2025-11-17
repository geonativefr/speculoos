# Filters API Reference

The Filters module provides a comprehensive system for managing query string filters with Vue Router integration. It includes various filter types and automatic synchronization with URL parameters.

## Overview

The Filters module includes:
- **FilterCollection**: Manages multiple filters together
- **Filter Types**: Text, date range, array, item, order, range, truthy filters
- **Vue Router Integration**: Automatic URL synchronization
- **Normalization**: Converts filters to query parameters
- **Denormalization**: Converts query parameters back to filter objects

## Core API

### useFilters(initialState, options?)

Composable for creating reactive filter collections with Vue Router integration.

```javascript
import { useFilters, TextFilter, ItemFilter } from 'speculoos';

const { filters, buildQueryParams, submit, clear } = useFilters(
  () => ({
    search: new TextFilter('title'),
    author: new ItemFilter('author'),
    status: new ItemFilter('status')
  }),
  {
    preserveQuery: true,
    targetRoute: computed(() => route)
  }
);
```

**Parameters:**
- `initialState` (Function): Function returning initial filter collection
- `options` (Object, optional): Configuration options
  - `preserveQuery` (Boolean, default: false): Preserve existing query parameters
  - `targetRoute` (Ref|Computed): Target route for navigation

**Returns:**
- `Object`: Filter management object
  - `filters` (Ref): Reactive filter collection
  - `buildQueryParams` (Function): Build query parameters from filters
  - `submit` (Function): Apply filters and navigate
  - `clear` (Function): Reset all filters

## Filter Types

### TextFilter

Filter for text-based search with configurable matching strategy.

```javascript
import { TextFilter } from 'speculoos';

const searchFilter = new TextFilter('title', {
  match: 'contains', // 'contains', 'starts_with', 'ends_with', 'exact'
  caseSensitive: false
});
```

**Constructor Parameters:**
- `property` (String): Property name to filter on
- `options` (Object, optional): Configuration options
  - `match` (String, default: 'contains'): Matching strategy
  - `caseSensitive` (Boolean, default: false): Case sensitivity

**Methods:**
- `normalize()`: Convert to query parameter object
- `denormalize(value)`: Update filter from query parameter value

### DateRangeFilter

Filter for date range selections.

```javascript
import { DateRangeFilter } from 'speculoos';

const dateFilter = new DateRangeFilter('publishedAt');
const fromDate = dateFilter.from(); // From date filter
const toDate = dateFilter.to(); // To date filter

// Or create with specific range
const rangeFilter = DateRangeFilter('createdAt')
  .from(new Date('2023-01-01'))
  .to(new Date('2023-12-31'));
```

**Constructor Parameters:**
- `property` (String): Property name to filter on

**Methods:**
- `from(date)`: Set start date
- `to(date)`: Set end date
- `normalize()`: Convert to query parameters
- `denormalize(value)`: Update from query parameters

### DatetimeRangeFilter

Filter for datetime range selections with time precision.

```javascript
import { DatetimeRangeFilter } from 'speculoos';

const datetimeFilter = new DatetimeRangeFilter('updatedAt');
```

**Constructor Parameters:**
- `property` (String): Property name to filter on

**Methods:**
- `from(datetime)`: Set start datetime
- `to(datetime)`: Set end datetime
- `normalize()`: Convert to query parameters
- `denormalize(value)`: Update from query parameters

### ArrayFilter

Filter for array-based selections (multiple values).

```javascript
import { ArrayFilter } from 'speculoos';

const categoriesFilter = new ArrayFilter('categories', {
  separator: ',' // Default separator for multiple values
});
```

**Constructor Parameters:**
- `property` (String): Property name to filter on
- `options` (Object, optional): Configuration options
  - `separator` (String, default: ','): Separator for multiple values

**Methods:**
- `normalize()`: Convert to query parameters
- `denormalize(value)`: Update from query parameters

### ItemFilter

Filter for single value selection from predefined options.

```javascript
import { ItemFilter } from 'speculoos';

const statusFilter = new ItemFilter('status');
const authorFilter = new ItemFilter('author', {
  options: [
    { value: '/authors/1', label: 'Author 1' },
    { value: '/authors/2', label: 'Author 2' }
  ]
});
```

**Constructor Parameters:**
- `property` (String): Property name to filter on
- `options` (Object, optional): Configuration options
  - `options` (Array): Predefined options for selection

**Methods:**
- `normalize()`: Convert to query parameter
- `denormalize(value)`: Update from query parameter

### OrderFilter

Filter for sorting with direction control.

```javascript
import { OrderFilter } from 'speculoos';

const orderFilter = new OrderFilter('title', {
  direction: 'asc' // 'asc' or 'desc'
});

// Or dynamic direction
const orderFilter = new OrderFilter('createdAt')
  .asc()  // Ascending order
  .desc(); // Descending order
```

**Constructor Parameters:**
- `property` (String): Property name to sort on
- `options` (Object, optional): Configuration options
  - `direction` (String, default: 'asc'): Sort direction

**Methods:**
- `asc()`: Set ascending order
- `desc()`: Set descending order
- `normalize()`: Convert to query parameter
- `denormalize(value)`: Update from query parameter

### RangeFilter

Filter for numeric range selections.

```javascript
import { RangeFilter } from 'speculoos';

const priceFilter = new RangeFilter('price');
const minPrice = priceFilter.min(); // Minimum value
const maxPrice = priceFilter.max(); // Maximum value

// Or set specific range
priceFilter.min(10).max(100);
```

**Constructor Parameters:**
- `property` (String): Property name to filter on

**Methods:**
- `min(value)`: Set minimum value
- `max(value)`: Set maximum value
- `normalize()`: Convert to query parameters
- `denormalize(value)`: Update from query parameters

### TruthyFilter

Filter for boolean/checkbox-style selections.

```javascript
import { TruthyFilter } from 'speculoos';

const activeFilter = new TruthyFilter('isActive');
const publishedFilter = new TruthyFilter('published', {
  trueValue: 'yes',
  falseValue: 'no'
});
```

**Constructor Parameters:**
- `property` (String): Property name to filter on
- `options` (Object, optional): Configuration options
  - `trueValue` (String, default: '1'): Value for true state
  - `falseValue` (String, default: '0'): Value for false state

**Methods:**
- `normalize()`: Convert to query parameter
- `denormalize(value)`: Update from query parameter

## FilterCollection

### Constructor

Creates a collection of related filters.

```javascript
import { FilterCollection, TextFilter, ItemFilter } from 'speculoos';

const filters = new FilterCollection({
  search: new TextFilter('title'),
  author: new ItemFilter('author'),
  status: new ItemFilter('status'),
  price: new RangeFilter('price')
});
```

**Parameters:**
- `filters` (Object): Filter instances keyed by name

### Methods

#### normalize()

Converts all filters to query parameter object.

```javascript
const queryParams = filters.normalize();
// Result:
// {
//   search: 'keyword',
//   author: '/authors/1',
//   status: 'published',
//   price: '10..100'
// }
```

**Returns:**
- `Object`: Query parameters object

#### denormalize(input)

Updates filters from query parameter object.

```javascript
await filters.denormalize({
  search: 'keyword',
  author: '/authors/1',
  status: 'published',
  price: '10..100'
});
```

**Parameters:**
- `input` (Object): Query parameters from URL

**Returns:**
- `Promise<FilterCollection>`: Updated filter collection

## Advanced Usage

### 1. Custom Filters

Create custom filter types by extending base Filter class:

```javascript
import { Filter } from 'speculoos';

class AutocompleteFilter extends Filter {
  constructor(property, minChars = 2) {
    super(property);
    this.minChars = minChars;
    this.suggestions = [];
  }
  
  normalize() {
    if (this.value && this.value.length >= this.minChars) {
      return { [this.property]: this.value };
    }
    return null;
  }
  
  async denormalize(value) {
    this.value = value;
    
    if (value.length >= this.minChars) {
      this.suggestions = await this.fetchSuggestions(value);
    }
  }
  
  async fetchSuggestions(query) {
    const response = await fetch(`/api/suggestions?q=${query}`);
    return response.json();
  }
}

// Usage
const autocompleteFilter = new AutocompleteFilter('title', 3);
```

### 2. Filter Dependencies

Create filters that depend on other filters:

```javascript
import { FilterCollection, ItemFilter, TextFilter } from 'speculoos';

class DependentFilter extends Filter {
  constructor(property, dependencyFilter) {
    super(property);
    this.dependencyFilter = dependencyFilter;
  }
  
  normalize() {
    // Only include if dependency has value
    if (this.dependencyFilter.value) {
      return { [this.property]: this.value };
    }
    return null;
  }
  
  get available() {
    return !!this.dependencyFilter.value;
  }
}

// Usage
const categoryFilter = new ItemFilter('category');
const subcategoryFilter = new DependentFilter('subcategory', categoryFilter);

const filters = new FilterCollection({
  category: categoryFilter,
  subcategory: subcategoryFilter
});
```

### 3. Filter Validation

Add validation to filters:

```javascript
class ValidatedFilter extends Filter {
  constructor(property, validator) {
    super(property);
    this.validator = validator;
    this.error = null;
  }
  
  normalize() {
    if (this.validator(this.value)) {
      return { [this.property]: this.value };
    }
    
    this.error = 'Invalid value';
    return null;
  }
  
  get isValid() {
    return !this.error;
  }
}

// Usage
const priceFilter = new ValidatedFilter('price', (value) => {
  return value >= 0 && value <= 1000;
});
```

### 4. Filter Persistence

Persist filter state across sessions:

```javascript
import { FilterCollection } from 'speculoos';

class PersistentFilterCollection extends FilterCollection {
  constructor(filters, storageKey = 'filters') {
    super(filters);
    this.storageKey = storageKey;
    this.loadFromStorage();
  }
  
  normalize() {
    const result = super.normalize();
    this.saveToStorage(result);
    return result;
  }
  
  denormalize(input) {
    const result = super.denormalize(input);
    this.saveToStorage(result);
    return result;
  }
  
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.denormalize(data);
      }
    } catch (error) {
      console.warn('Failed to load filters from storage:', error);
    }
  }
  
  saveToStorage(filters) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(filters));
    } catch (error) {
      console.warn('Failed to save filters to storage:', error);
    }
  }
}
```

### 5. Dynamic Filter Options

Load filter options dynamically:

```javascript
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
  
  async denormalize(value) {
    this.value = value;
    await this.loadOptions();
  }
}

// Usage
const authorFilter = new DynamicItemFilter('author', async () => {
  const response = await fetch('/api/authors');
  return response.json();
});
```

## Integration with Vue Router

### 1. Route-based Filters

Configure filters for specific routes:

```javascript
const { filters, submit } = useFilters(
  () => ({
    search: new TextFilter('title'),
    author: new ItemFilter('author')
  }),
  {
    targetRoute: computed(() => ({
      name: 'books',
      query: route.query
    }))
  }
);

// Apply filters will navigate to books route
submit();
```

### 2. Query Preservation

Preserve existing query parameters when applying filters:

```javascript
const { filters, submit } = useFilters(
  () => ({
    status: new ItemFilter('status')
  }),
  {
    preserveQuery: true // Keep existing query params like page, sort
  }
);

// Submit will preserve page=2&sort=createdAt while adding status filter
submit();
```

### 3. Multiple Route Support

Handle different filter sets for different routes:

```javascript
const getFiltersForRoute = (routeName) => {
  switch (routeName) {
    case 'books':
      return {
        search: new TextFilter('title'),
        author: new ItemFilter('author')
      };
    case 'users':
      return {
        role: new ItemFilter('role'),
        active: new TruthyFilter('active')
      };
    default:
      return {};
  }
};

const { filters, submit } = useFilters(
  () => getFiltersForRoute(route.name.value),
  {
    targetRoute: route
  }
);
```

## Performance Optimization

### 1. Debounced Filtering

Debounce filter applications for better performance:

```javascript
import { useFilters } from 'speculoos';
import { debounce } from 'lodash-es';

const { filters, submit } = useFilters(
  () => ({
    search: new TextFilter('title')
  }),
  {
    // Custom debounced submit
    submit: debounce(() => {
      const queryParams = filters.value.normalize();
      router.push({ query: queryParams });
    }, 300)
  }
);
```

### 2. Lazy Loading

Load filter options only when needed:

```javascript
class LazyItemFilter extends ItemFilter {
  constructor(property, optionsLoader) {
    super(property);
    this.optionsLoader = optionsLoader;
    this.loaded = false;
  }
  
  async loadOptionsIfNeeded() {
    if (!this.loaded) {
      this.options = await this.optionsLoader();
      this.loaded = true;
    }
  }
  
  async denormalize(value) {
    this.value = value;
    await this.loadOptionsIfNeeded();
  }
}
```

### 3. Filter Caching

Cache filter options to avoid repeated requests:

```javascript
class CachedItemFilter extends ItemFilter {
  constructor(property, optionsLoader, cacheKey) {
    super(property);
    this.optionsLoader = optionsLoader;
    this.cacheKey = cacheKey;
    this.cache = new Map();
  }
  
  async loadOptions() {
    if (this.cache.has(this.cacheKey)) {
      this.options = this.cache.get(this.cacheKey);
      return;
    }
    
    const options = await this.optionsLoader();
    this.cache.set(this.cacheKey, options);
    this.options = options;
  }
}
```

## Testing

### 1. Filter Testing

```javascript
import { TextFilter, ItemFilter } from 'speculoos';

describe('Filters', () => {
  test('TextFilter normalization', () => {
    const filter = new TextFilter('title');
    filter.value = 'test keyword';
    
    const normalized = filter.normalize();
    expect(normalized).toEqual({ title: 'test keyword' });
  });
  
  test('ItemFilter denormalization', async () => {
    const filter = new ItemFilter('status');
    
    await filter.denormalize('published');
    expect(filter.value).toBe('published');
  });
});
```

### 2. FilterCollection Testing

```javascript
import { FilterCollection, TextFilter, ItemFilter } from 'speculoos';

describe('FilterCollection', () => {
  test('normalizes multiple filters', () => {
    const filters = new FilterCollection({
      search: new TextFilter('title'),
      status: new ItemFilter('status')
    });
    
    filters.search.value = 'test';
    filters.status.value = 'published';
    
    const normalized = filters.normalize();
    expect(normalized).toEqual({
      search: 'test',
      status: 'published'
    });
  });
  
  test('denormalizes from query object', async () => {
    const filters = new FilterCollection({
      search: new TextFilter('title'),
      status: new ItemFilter('status')
    });
    
    await filters.denormalize({
      search: 'test',
      status: 'published'
    });
    
    expect(filters.search.value).toBe('test');
    expect(filters.status.value).toBe('published');
  });
});
```

## Best Practices

### 1. Filter Design

- Use specific filter types for appropriate data
- Provide clear labels and descriptions
- Implement proper validation
- Handle edge cases (empty values, special characters)

### 2. Performance

- Debounce rapid filter changes
- Lazy load filter options when needed
- Cache frequently used options
- Avoid unnecessary re-renders

### 3. User Experience

- Provide clear visual feedback for filter states
- Show filter counts and active filters
- Implement filter presets for common combinations
- Allow easy filter clearing and resetting

### 4. Integration

- Use useFilters() composable for consistency
- Integrate properly with Vue Router
- Handle browser back/forward navigation
- Maintain filter state across route changes

## See Also

- [Core Concepts - Vue 3 Reactivity](../core-concepts/vue3-reactivity.md) - Reactivity patterns
- [API Reference - Store](./store.md) - Store integration
- [Guides - Advanced Filtering](../guides/advanced-filtering.md) - Practical filtering examples