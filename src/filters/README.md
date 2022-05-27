# Filters

Some classes to denormalize / normalize filters from / to the query string.

## Example usage

`useFilters<Promise>(initialState: Function, options: Object)`

```js
import { FilterCollection, TextFilter, TruthyFilter, useFilters } from 'speculoos';

const {filters, submit} = await useFilters(() => new FilterCollection({
    name: new TextFilter(),
    current: new TruthyFilter(true),
}));

// Consider current location query string ?name=foo
// console.log(unref(filters).name.value); // 'foo'
// console.log(unref(filters).current.value); // true

// Consider binding filters with v-models to edit them
// e.g. now condiser that filters.name.value is 'bar'

await submit(); // will router.push [current location]?name=bar&current=true
```

### `useFilters()` options

- `preserveQuery` will keep current query string
- `targetRoute` will allow you to specify a different route when submitting filters (instead of refreshing the current one).

## Available Filters

### TextFilter

```js
// ?name=foo
import { FilterCollection, TextFilter } from 'speculoos';

const {filters} = await useFilters(() => new FilterCollection({
    name: new TextFilter(),
}));
// console.log(unref(filters).name.value); // 'foo'
```

### TruthyFilter

```js
// ?current=true
import { FilterCollection, TruthyFilter } from 'speculoos';

const {filters} = await useFilters(() => new FilterCollection({
    current: new TruthyFilter(),
}));
// console.log(unref(filters).current.value); // true
```

### DateRangeFilter

```js
// ?createdAt[after]=2022-02-28T23:00:00Z&createdAt[before]=2022-03-01T22:59:59Z
import { FilterCollection, DateRangeFilter } from 'speculoos';

const {filters} = await useFilters(() => new FilterCollection({
    createdAt: new DateRangeFilter(),
}));
// Considering QS is UTC and user timezone is Europe/Paris (guessed by browser)
// console.log(unref(filters).createdAt.after); // '2022-03-01'
// console.log(unref(filters).createdAt.before); // '2022-03-01'
```

### OrderFilter

```js
// ?sort[createdAt]=desc
import { FilterCollection, OrderFilter } from 'speculoos';

const {filters} = await useFilters(() => new FilterCollection({
    sort: new OrderFilter(),
}));
// console.log(unref(filters).sort.order); // {createdAt: 'desc'}
```

### ItemFilter

#### Single item

```js
// ?foo=/api/foos/1
import { FilterCollection, ItemFilter, useStore } from 'speculoos';

const store = useStore();
const {filters} = await useFilters(() => new FilterCollection({
    foo: new ItemFilter(),
}), {store});
// console.log(unref(filters).foo.item); // {'@id': '/api/foos/1', '@type': 'Foo', ...}
```

#### Multiple items

```js
// ?foo[]=/api/foos/1
import { FilterCollection, ItemFilter, useStore } from 'speculoos';

const store = useStore();
const {filters} = await useFilters(() => new FilterCollection({
    foo: new ItemFilter(),
}), {store});
// console.log(unref(filters).foo.items); // [{'@id': '/api/foos/1', '@type': 'Foo', ...}]
```
