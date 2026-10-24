import { createApp, reactive } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import { QueryString } from 'psr7-js';
import { ApiClient, createMercure, createStore, HydraPlugin } from 'speculoos';
import { App, recordError } from './App.js';
import { Author, Book } from './models.js';
import BookList from './pages/BookList.js';
import BookForm from './pages/BookForm.js';
import LiveBook from './pages/LiveBook.js';
import SignedOut from './pages/SignedOut.js';

const apiUrl = import.meta.env.API_URL;

async function start() {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      {path: '/', redirect: '/books'},
      {path: '/books', name: 'books', component: BookList},
      {path: '/books/new', name: 'book-new', component: BookForm},
      {path: '/books/:id', name: 'book', component: BookForm},
      {path: '/live', name: 'live', component: LiveBook},
      {path: '/signed-out', name: 'signed-out', component: SignedOut},
    ],
    // Nested query parameters, such as tags[] and publishedAt[after]
    parseQuery: (search) => new QueryString(search).getParams(),
    stringifyQuery: (query) => new QueryString(query).toString(),
  });

  const client = new ApiClient({
    baseUri: apiUrl,
    options: reactive({
      headers: {
        'Accept-Language': 'fr',
      },
    }),
  });

  const store = await createStore();
  await store.use(new HydraPlugin(client, {
    endpoints: {
      Book: '/api/books',
      Author: '/api/authors',
    },
    classmap: {Book, Author},
    // An expired session leaves the page without throwing; any other error goes to the caller.
    errorHandler(error) {
      if (401 === error.statusCode) {
        router.push('/signed-out');
        return;
      }
      throw error;
    },
  }));

  const mercure = createMercure(`${apiUrl}/.well-known/mercure`, {reconnectInterval: 2000});

  const app = createApp(App);
  app.config.errorHandler = recordError;
  window.addEventListener('unhandledrejection', (event) => recordError(event.reason));
  app.use(router);
  app.use(store);
  app.use(mercure);
  await router.isReady();
  app.mount('#app');
}

start().catch(recordError);
