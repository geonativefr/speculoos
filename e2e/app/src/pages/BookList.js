import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import {
  ArrayFilter,
  DateRangeFilter,
  FilterCollection,
  TextFilter,
  useEndpoint,
  useFilters,
  useStore,
} from 'speculoos';

export default {
  async setup() {
    const store = useStore();
    const route = useRoute();
    const endpoint = useEndpoint('Book');
    const books = ref();
    const error = ref();

    // The query of the page is the query of the API request
    const load = async () => {
      try {
        error.value = undefined;
        books.value = await store.fetchCollection(endpoint.synchronize());
      } catch (e) {
        books.value = undefined;
        error.value = `${e.name}: ${e.message}`;
      }
    };
    // Set up before the first await, so that it stops when the page is left
    watch(() => route.query, () => 'books' === route.name && load());

    const {filters, submit} = await useFilters(() => new FilterCollection({
      title: new TextFilter(),
      tags: new ArrayFilter(),
      publishedAt: new DateRangeFilter({}, {withTime: false}),
    }));
    await load();

    return {filters, submit, books, error, tags: ['fiction', 'history', 'science']};
  },
  template: `
    <h1>Books</h1>
    <form data-test="filters" @submit.prevent="submit()">
      <label>Title <input name="title" v-model="filters.title.value"></label>
      <label v-for="tag in tags" :key="tag">
        <input type="checkbox" name="tags" :value="tag" v-model="filters.tags.values"> {{ tag }}
      </label>
      <label>Published after <input type="date" name="publishedAfter" v-model="filters.publishedAt.after"></label>
      <label>Published before <input type="date" name="publishedBefore" v-model="filters.publishedAt.before"></label>
      <button type="submit">Filter</button>
    </form>
    <router-link to="/books" data-test="all-books">All books</router-link>
    <template v-if="books">
      <p data-test="total">Total: {{ books.totalItems }}</p>
      <ul data-test="books">
        <li v-for="book in books" :key="book['@id']">{{ book.title }}</li>
      </ul>
    </template>
    <p v-if="error" data-test="error">{{ error }}</p>
  `,
};
