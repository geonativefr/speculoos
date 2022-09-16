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
store.getItemsByType('Book'); // Returns all stored items having `@type` set to `Book`.
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
import { HydraPlugin } from 'speculoos';

const plugin = new HydraPlugin(client, {
  endpoints: {
    Book: '/api/books',
    Author: '/api/authors',
  },
});
```

### Retrieving an endpoint
You can request an endpoint via `store.state.endpoints` or with the following composable:

```vue
<script setup>
import { useEndpoint } from 'speculoos'

const bookEndpoint = useEndpoint('Book'); // HydraEndpoint: /api/books
</script>
```

Out of `setup` scope:

```js
const endpoint = store.endpoint('Book')
```

For a specific item:

```js
const endpoint = store.endpoint('Book').buildIri('123456'); // i.e. /api/books/123456
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

## Relations

You can use `store.getRelation()` and `store.getRelations()` (when multiple) to retrieve the relations of an item.
The difference is that a relation which is already an object, will be **returned as-is** and **won't be stored**,
because 1) a relation can be a partial item and 2) the full item may not be 100% accessible on purpose (403 on GET).

| Method          | Input Type   | IRI known in store? | Result                                  |
| --------------- | ------------ | ------------------- | --------------------------------------- |
| `getItem()`     | IRI (string) |                 Yes | Returns the existing item in the store. |
| `getRelation()` | IRI (string) |                 Yes | Returns the existing item in the store. |
| `getItem()`     | Object       |                 Yes | Returns the existing item in the store (matching input['@id']), regardless of the input object. |
| `getRelation()` | Object       |                 Yes | Returns the existing item in the store, regardless of the input object (except if `options.useExisting` is `false`).|
| `getItem()`     | IRI (string) |                  No | Retrieves the item through `fetchItem()`, stores it, returns it. |
| `getRelation()` | IRI (string) |                  No | Transfers to `getItem()`. |
| `getItem()`     | Object       |                  No | Retrieves the item through `fetchItem(input['@id'])`, stores it, returns it, regardless of the input object. |
| `getRelation()` | Object       |                  No | Returns the input object, without storing it (except if `options.force` is `true`, which will trigger a `getItem()`). |

### Synchronize relations

Instead getting a relation with a property:
```js
const driver = await store.getRelation(car.driver);
```

You can use a wrapping function:
```js
const driver = await store.getRelation(() => car.driver);
```

So that whenever `car.driver` (IRI) changes, `driver` (item) changes as well.
