# Store

This package provides a very lightweight implementation of the store pattern for global state management.

## Usage

Instead of defining state, getters, mutations, actions, and lots of boring stuff, you only have to define:
- The initial `state` object (it will be read-only and reactive once the store is created, meaning it can contain computed props)
- An optional set of `methods` to mutate the state
- An optional name to differentiate multiple stores.

```javascript
// main.js
import { createStore } from 'speculoos';

const state = {foo: 'foo'};
const methods = {updateFoo: (state, value) => state.foo = value};
const store = await createStore({state, methods});
app.use(store);
```

```vue
<script setup>
// SomeComponent.vue
import { useStore } from 'speculoos';

const store = useStore();
console.log(store.state.foo); // foo

store.state.foo = 'bar'; // Error: state is readonly

store.updateFoo('bar');
console.log(store.state.foo); // bar
</script>
```

## Using plugins

```javascript
// main.js
import { createStore } from 'speculoos';

const userPlugin = {
    async install(store) {
        store.state.user = null; // Decorate initial state - state is not readonly yet at this point
        store.setUser = (user) => this.setUser(store.state, user); // Add accessors
    },
    setUser(state, user) {
        state.user = user;
    },
}
const store = (await createStore()).use(userPlugin);
app.use(store);
```

### Reconciliation

Plugins implementing a `reconciliate(store)` method will be called when you explicitely call `await store.reconciliate()`.
This can be useful, once all plugins are instantiated, to retrieve or build the initial state of the application.

```javascript
const store = await createStore();
await store.use(new UserPlugin());
await store.use(new ApplicationPlugin());
await store.reconciliate(true); // If you explicitely pass `true`, reconcilation methods will be called sequentially, by the order the plugins were installed.
```

## Using different stores

You can name your stores to manage several, independent states.

```javascript
// main.js
import { createStore } from 'speculoos';

const itemsStore = await createStore({state: {items: []}, name: 'items'});
const userStore = await createStore({state: {user: null}, name: 'user'});
app.use(itemsStore);
app.use(userStore);
```

```vue
<script setup>
// SomeComponent.vue
import { useStore } from 'speculoos';

const itemsStore = useStore('items');
const userStore = useStore('user');
</script>
```

## Using computed state

Some of your state properties can be computed (like VueX "getters"). Make sure your computation occurs either on a _ref_,
either on a property of a _reactive_ object.

```javascript
// main.js
import { computed, reactive } from 'vue';
import { createStore } from 'speculoos';

const state = reactive({
    firstName: 'Barack',
    lastName: 'Obama',
});
state.fullName = computed(() => `${state.firstName} ${state.lastName.toUpperCase()}`);

function updateName(state, firstName, lastName) {
  state.firstName = firstName;
  state.lastName = lastName;
}

const store = await createStore({state, methods: {updateName}})
app.use(store);
```

```vue
<script setup>
// SomeComponent.vue
import { useStore } from 'speculoos';

const {state, updateName} = useStore();
updateName('Joe', 'Biden');

console.log(state.fullName); // Joe BIDEN
</script>
```
