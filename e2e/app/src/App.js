import { reactive } from 'vue';

// The errors no caller handled: the tests expect none.
export const errors = reactive([]);

export const App = {
  setup() {
    return {errors};
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
    <ul data-test="app-errors">
      <li v-for="(error, index) in errors" :key="index">{{ error }}</li>
    </ul>
  `,
};
