# Hydra Plugin

A plugin for `speculoos/store`.

## Setup

```js
// main.js
import { createStore, ApiClient, HydraPlugin } from 'speculoos';

const client = new ApiClient({baseUri: 'https://example.org'});
const store = await createStore();
await store.use(new HydraPlugin(client));
app.use(store);
```

## Usage in components

```js
import { useStore } from 'speculoos';

const store = useStore();
await store.getItem(iri, options); // Gets an item from the store, or fetches it from the API
await store.fetchItem(iri, options); // Fetches an item (API GET) from the API (and store it)
await store.fetchCollection(iri, options); // Fetches a HydraCollection (API GET) from the API (collections aren't stored)
await store.getRelation(iri, options); // Gets a ManyToOne relation of an item from the store, or fetches it from the API
await store.getRelations(iris, options); // Gets OneToMany relations of an item from the store, or fetches them from the API
await store.deleteItem(iri, options); // Delete an item through the API (API DELETE), removes it from the store
await store.createItem(item, options); // Creates an item (API POST), store it
await store.updateItem(item, options); // Updates an item (API PUT), store it
await store.upsert(item, options); // Creates or updates an item, depending whether it has an IRI
await store.storeItem(item); // Stores an item (no API involved)
await store.removeItem(item); // Removes an item from the store (no API involved)
```

## Item typing

Items can be typed when they are retrieved.

```js
class Book {
    isbn;
    author;
}
class Author {
    name;
}
const plugin = new HydraPlugin(client, {
  classmap: {
    Book,
    Author,
  },
});
```

```js
import { useStore } from 'speculoos';

const store = useStore();
const book = await store.getItem('/api/books/1'); // {'@type': "Book", '@id' => '/api/books/1', isbn: '9782717721134', author: '/api/authors/1'}
console.log(book instanceof Book); // true
const author = await store.getRelation(book.author);
console.log(author instanceof Author); // true
```

Items are reactive, meaning they can contain ref / computed props.

```js
import { computed } from 'vue';

class Alert {
    type;
    get color() {
        return computed(() => 'CRITICAL' === this.type ? 'red': 'gray');
    }
}

// ...

const alert = await store.getItem('/api/alerts/1');
console.log(alert.color); // red / gray
```

### HydraCollection

Using `store.fetchCollection()` will return a `HydraCollection` object.

```js
const items = await store.fetchCollection('/api/books');
console.log(items.length); // current length (pagination involved)
console.log(items.totalItems); // total items (pagination not involved)
for (const item of items) { // HydraCollection is a generator
    console.log(book instanceof Book); // true
}
```

## Endpoints

Endpoints are needed to create items, so that we know what collection URL to hit given an item's `@type`.

```js
const plugin = new HydraPlugin(client, {
  endpoints: {
    Book: '/api/books',
    Author: '/api/authors',
  },
});
```

### Pagination

```js
plugin.endpoints['Book'].paginated(); // /api/books?pagination=1
plugin.endpoints['Book'].paginated(100); // /api/books?pagination=1&itemsPerPage=100
plugin.endpoints['Book'].paginated(false); // /api/books?pagination=0
```

### Current location query synchronization

```js
// Current location: /books?foo=bar&page=2
plugin.endpoints['Book'].synchronize(); // /api/books?foo=bar&page=2
```

## Synchronize relations

Instead getting a relation with a property:
```js
const driver = await store.getRelation(car.driver);
```

You can use a wrapping function:
```js
const driver = await store.getRelation(() => car.driver);
```

So that whenever `car.driver` (IRI) changes, `driver` (item) changes as well.
