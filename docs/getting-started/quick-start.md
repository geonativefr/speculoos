# Quick Start

Get up and running with Speculoos in minutes. This guide will walk you through the essential concepts and basic usage patterns.

## What You'll Build

We'll create a simple book management application that demonstrates:
- Fetching collections from a Hydra API
- Creating and updating items
- Real-time updates with Mercure
- Filtering and pagination

## Step 1: Basic Setup

Assuming you've completed the [installation](./installation.md), let's set up a minimal configuration:

```javascript
// src/main.js
import { createApp } from 'vue';
import { createStore, ApiClient, HydraPlugin, createMercure } from 'speculoos';
import App from './App.vue';

// Create API client
const api = new ApiClient({
  baseUri: 'https://api.example.com'
});

// Create store with Hydra plugin
const store = await createStore({
  state: {
    books: [],
    loading: false
  },
  methods: {
    setLoading(state, loading) {
      state.loading = loading;
    }
  }
}).use(new HydraPlugin(api));

// Create Mercure client
const mercure = createMercure('https://mercure.example.com/.well-known/mercure');

const app = createApp(App);
app.use(store);
app.use(mercure);
app.mount('#app');
```

## Step 2: Fetching Data

Create a component to display a list of books:

```vue
<!-- src/components/BookList.vue -->
<template>
  <div>
    <h1>Books</h1>
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">{{ error }}</div>
    <ul v-else>
      <li v-for="book in books" :key="book['@id']">
        {{ book.title }} by {{ book.author }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useStore } from 'speculoos';

const store = useStore();
const books = ref([]);
const loading = ref(false);
const error = ref(null);

const loadBooks = async () => {
  try {
    loading.value = true;
    error.value = null;
    const collection = await store.fetchCollection('/books');
    books.value = collection['hydra:member'];
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadBooks();
});
</script>
```

## Step 3: Creating Items

Let's add a form to create new books:

```vue
<!-- src/components/BookForm.vue -->
<template>
  <form @submit.prevent="handleSubmit">
    <h2>{{ isEditing ? 'Edit Book' : 'Add Book' }}</h2>
    
    <div>
      <label for="title">Title:</label>
      <input 
        id="title"
        v-model="form.title" 
        type="text" 
        required 
      />
    </div>
    
    <div>
      <label for="author">Author:</label>
      <input 
        id="author"
        v-model="form.author" 
        type="text" 
        required 
      />
    </div>
    
    <div>
      <label for="publishedAt">Published:</label>
      <input 
        id="publishedAt"
        v-model="form.publishedAt" 
        type="date" 
      />
    </div>
    
    <button type="submit" :disabled="submitting">
      {{ submitting ? 'Saving...' : (isEditing ? 'Update' : 'Create') }}
    </button>
    
    <button type="button" @click="resetForm" v-if="isEditing">
      Cancel
    </button>
  </form>
</template>

<script setup>
import { ref, reactive, watch } from 'vue';
import { useStore } from 'speculoos';
import { useItemForm } from 'speculoos';

const store = useStore();
const emit = defineEmits(['created', 'updated']);

// Use Speculoos form helper
const { item: form, isCreationMode, isSubmitting, reset, submit } = useItemForm({
  title: '',
  author: '',
  publishedAt: ''
});

const isEditing = ref(false);

const handleSubmit = async () => {
  try {
    const result = await submit();
    emit(isCreationMode.value ? 'created' : 'updated', result);
    resetForm();
  } catch (error) {
    console.error('Failed to save book:', error);
  }
};

const resetForm = () => {
  reset();
  isEditing.value = false;
};

const editBook = (book) => {
  reset(book);
  isEditing.value = true;
};

defineExpose({ editBook });
</script>
```

## Step 4: Real-time Updates

Add real-time functionality to automatically update when books change:

```vue
<!-- src/components/BookList.vue (enhanced) -->
<template>
  <div>
    <h1>Books</h1>
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">{{ error }}</div>
    <ul v-else>
      <li v-for="book in books" :key="book['@id']">
        {{ book.title }} by {{ book.author }}
        <small v-if="book.updatedAt">(Updated: {{ formatDate(book.updatedAt) }})</small>
        <button @click="editBook(book)">Edit</button>
        <button @click="deleteBook(book)">Delete</button>
      </li>
    </ul>
    
    <BookForm @created="onBookCreated" @updated="onBookUpdated" ref="bookForm" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useStore, useMercureSync } from 'speculoos';
import BookForm from './BookForm.vue';

const store = useStore();
const mercureSync = useMercureSync();
const books = ref([]);
const loading = ref(false);
const error = ref(null);
const bookForm = ref(null);

let mercureListener = null;

const loadBooks = async () => {
  try {
    loading.value = true;
    error.value = null;
    const collection = await store.fetchCollection('/books');
    books.value = collection['hydra:member'];
    
    // Set up real-time sync for loaded books
    mercureListener = mercureSync.synchronize(
      books.value,
      ['/books/{id}'],
      // Update handler
      (update, book) => {
        Object.assign(book, update);
      },
      // Delete handler
      (iri) => {
        const index = books.value.findIndex(book => book['@id'] === iri);
        if (index >= 0) {
          books.value.splice(index, 1);
        }
      }
    );
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const onBookCreated = (book) => {
  books.value.push(book);
};

const onBookUpdated = (book) => {
  const index = books.value.findIndex(b => b['@id'] === book['@id']);
  if (index >= 0) {
    books.value[index] = book;
  }
};

const editBook = (book) => {
  bookForm.value.editBook(book);
};

const deleteBook = async (book) => {
  if (confirm(`Are you sure you want to delete "${book.title}"?`)) {
    try {
      await store.deleteItem(book);
      // Real-time sync will handle the UI update
    } catch (error) {
      console.error('Failed to delete book:', error);
    }
  }
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString();
};

onMounted(() => {
  loadBooks();
});

onUnmounted(() => {
  // Mercure listeners are automatically cleaned up by useMercureSync
});
</script>
```

## Step 5: Adding Filtering

Implement search and filtering functionality:

```vue
<!-- src/components/BookFilters.vue -->
<template>
  <div class="filters">
    <h3>Filters</h3>
    
    <div>
      <label for="search">Search:</label>
      <input 
        id="search"
        v-model="filters.search.value" 
        type="text" 
        placeholder="Search books..."
        @input="debouncedApplyFilters"
      />
    </div>
    
    <div>
      <label for="author">Author:</label>
      <select 
        id="author"
        v-model="filters.author.value" 
        @change="applyFilters"
      >
        <option value="">All Authors</option>
        <option v-for="author in authors" :key="author" :value="author">
          {{ author }}
        </option>
      </select>
    </div>
    
    <div>
      <label for="dateFrom">Published From:</label>
      <input 
        id="dateFrom"
        v-model="filters.publishedFrom.value" 
        type="date" 
        @change="applyFilters"
      />
    </div>
    
    <div>
      <label for="dateTo">Published To:</label>
      <input 
        id="dateTo"
        v-model="filters.publishedTo.value" 
        type="date" 
        @change="applyFilters"
      />
    </div>
    
    <button @click="clearFilters">Clear Filters</button>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue';
import { useFilters, TextFilter, ItemFilter, DateRangeFilter } from 'speculoos';
import { useRouter } from 'vue-router';

const router = useRouter();

const authors = ref([]);

// Create filter collection
const { filters, submit, clear } = useFilters(() => ({
  search: new TextFilter('title'),
  author: new ItemFilter('author'),
  publishedFrom: new DateRangeFilter('publishedAt').from(),
  publishedTo: new DateRangeFilter('publishedAt').to()
}), {
  preserveQuery: true
});

const debouncedApplyFilters = debounce(() => {
  applyFilters();
}, 300);

const applyFilters = () => {
  submit();
};

const clearFilters = () => {
  clear();
  applyFilters();
};

// Simple debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Load authors for filter dropdown
onMounted(async () => {
  try {
    const store = useStore();
    const collection = await store.fetchCollection('/authors');
    authors.value = collection['hydra:member'].map(author => author.name);
  } catch (error) {
    console.error('Failed to load authors:', error);
  }
});
</script>

<style scoped>
.filters {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.filters > div {
  margin-bottom: 0.5rem;
}

.filters label {
  display: inline-block;
  width: 120px;
  font-weight: bold;
}

.filters input, .filters select {
  padding: 0.25rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.filters button {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.filters button:hover {
  background: #0056b3;
}
</style>
```

## Step 6: Adding Pagination

Implement pagination for large collections:

```vue
<!-- src/components/BookPagination.vue -->
<template>
  <div class="pagination" v-if="pager">
    <button 
      @click="goToPage(pager.previousPage)" 
      :disabled="pager.isFirstPage()"
    >
      Previous
    </button>
    
    <span class="page-numbers">
      <button 
        v-for="page in truncatedPager" 
        :key="page"
        @click="goToPage(page)"
        :class="{ active: pager.isCurrentPage(page) }"
        :disabled="pager.isCurrentPage(page)"
      >
        {{ page }}
      </button>
    </span>
    
    <button 
      @click="goToPage(pager.nextPage)" 
      :disabled="pager.isLastPage()"
    >
      Next
    </button>
    
    <span class="pagination-info">
      Page {{ pager.currentPage }} of {{ pager.lastPage }}
      ({{ pager.totalItems }} total items)
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { createPager } from 'speculoos';

const props = defineProps({
  currentPage: {
    type: Number,
    default: 1
  },
  itemsPerPage: {
    type: Number,
    default: 10
  },
  totalItems: {
    type: Number,
    required: true
  }
});

const emit = defineEmits(['page-changed']);

const pager = computed(() => {
  return createPager({
    currentPage: props.currentPage,
    itemsPerPage: props.itemsPerPage,
    totalItems: props.totalItems
  });
});

const truncatedPager = computed(() => {
  return pager.value.truncate(2, true);
});

const goToPage = (page) => {
  if (!pager.value.isCurrentPage(page)) {
    emit('page-changed', page);
  }
};
</script>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin: 1rem 0;
}

.pagination button {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  border-radius: 4px;
}

.pagination button:hover:not(:disabled) {
  background: #f0f0f0;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination button.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
}

.pagination-info {
  margin-left: 1rem;
  color: #666;
}
</style>
```

## Complete Example

Here's how to tie everything together:

```vue
<!-- src/views/Books.vue -->
<template>
  <div>
    <h1>Book Management</h1>
    
    <BookFilters />
    
    <BookPagination 
      :current-page="currentPage"
      :items-per-page="itemsPerPage"
      :total-items="totalItems"
      @page-changed="onPageChanged"
    />
    
    <BookList />
    
    <BookPagination 
      :current-page="currentPage"
      :items-per-page="itemsPerPage"
      :total-items="totalItems"
      @page-changed="onPageChanged"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BookFilters from '../components/BookFilters.vue';
import BookList from '../components/BookList.vue';
import BookPagination from '../components/BookPagination.vue';

const route = useRoute();
const router = useRouter();

const currentPage = ref(parseInt(route.query.page) || 1);
const itemsPerPage = ref(10);
const totalItems = ref(0);

const onPageChanged = (page) => {
  currentPage.value = page;
  router.push({
    query: { ...route.query, page }
  });
};

watch(() => route.query.page, (newPage) => {
  currentPage.value = parseInt(newPage) || 1;
});

onMounted(() => {
  // Initial setup
});
</script>
```

## Next Steps

Congratulations! You've built a complete book management application with:

✅ **Data Fetching** - Using the Hydra plugin to fetch collections  
✅ **CRUD Operations** - Creating, reading, updating, and deleting books  
✅ **Real-time Updates** - Automatic UI updates with Mercure  
✅ **Filtering** - Search and filter functionality  
✅ **Pagination** - Navigate through large collections  

To learn more, check out:

- [First App](./first-app.md) - Build a complete application from scratch
- [Core Concepts](../core-concepts/) - Understand the underlying technologies
- [API Reference](../api-reference/) - Detailed module documentation
- [Guides](../guides/) - Practical tutorials and examples