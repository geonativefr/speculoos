import { reactive, ref } from 'vue';

// The errors no caller handled, and those a page failed to load with: the tests expect none.
export const errors = reactive([]);
export const recordError = (error) => errors.push(`${error?.name}: ${error?.message}`);

// The loads of a book by the book form that settled, kept when the page is left: the errors they left are listed then.
export const settledBookLoads = ref(0);

// The notice the error handler leaves on the page for a failure it takes care of without leaving the page.
export const notice = ref('');

export const App = {
  setup() {
    return {errors, settledBookLoads, notice};
  },
  template: `
    <nav>
      <router-link to="/books" data-test="nav-books">Books</router-link>
      <router-link to="/books/new">New book</router-link>
      <router-link to="/live">Live</router-link>
    </nav>
    <main>
      <router-view v-slot="{ Component, route }">
        <Suspense>
          <component :is="Component" :key="route.path" />
        </Suspense>
      </router-view>
    </main>
    <p v-if="notice" data-test="notice">{{ notice }}</p>
    <p data-test="settled-book-loads">{{ settledBookLoads }}</p>
    <ul data-test="app-errors">
      <li v-for="(error, index) in errors" :key="index">{{ error }}</li>
    </ul>
  `,
};
