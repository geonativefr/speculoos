import { promiseTimeout } from '@vueuse/core';
import { createStore, useStore } from '../index.ts';
import { createTestApp, useSetup, getInjectedStore } from '../../../vue-tests-setup.js';
import { computed, isReadonly, reactive } from 'vue';


it('creates a store', async () => {
  const store = await createStore();
  expect(Object.keys(store)).toContain('state');
  expect(store?.name).toBe('store');
});

it('has a read-only state', async () => {
  const store = await getInjectedStore();
  expect(Object.keys(store)).toContain('state');
  expect(isReadonly(store.state)).toBeTruthy();
});

it('can use mutation methods', async () => {
  const store = await getInjectedStore(await createStore({
    state: {foo: 'bar'},
    methods: {
      update: (state, value) => {
        state.foo = value;
      },
    },
  }));
  expect(Object.keys(store)).toContain('update');
  store.update('baz');
  expect(store.state.foo).toBe('baz');
});

it('can use plugins', async () => {
  const plugin = {
    update(state, value) {
      state.foo = value;
    },
    async install(store) {
      store.state.foo = 'bar';
      store.update = (value) => this.update(store.state, value);
    },
  };
  const providedStore = await (await createStore()).use(plugin);
  const store = await getInjectedStore(providedStore);
  expect(Object.keys(store.state)).toContain('foo');
  expect(Object.keys(store)).toContain('update');
  store.update('baz');
  expect(store.state.foo).toBe('baz');
});

it('can provide/inject distinct stores', async () => {
  const items = await createStore({state: {items: []}, name: 'items'});
  const user= await createStore({state: {user: null}, name: 'user'});
  const app = createTestApp(items, user);
  const {itemsStore, userStore} = await useSetup(app, async () => ({
    itemsStore: useStore('items'),
    userStore: useStore('user'),
  }));

  expect(Object.keys(itemsStore.state)).toContain('items');
  expect(Object.keys(itemsStore.state)).not.toContain('user');
  expect(Object.keys(userStore.state)).toContain('user');
  expect(Object.keys(userStore.state)).not.toContain('items');
});

it('can expose computed state', async () => {
  let state = reactive({
    counter: 2,
  });
  state.doubled = computed(() => state.counter * 2);
  const store = await getInjectedStore(await createStore({
    state: state,
    methods: {
      updateCounter: (state, value) => {
        state.counter = value;
      },
    },
  }));

  expect(store.state.counter).toBe(2);
  expect(store.state.doubled).toBe(4);

  // When
  store.updateCounter(10);

  // Then
  expect(store.state.counter).toBe(10);
  expect(store.state.doubled).toBe(20);
});

it('reconcilates state', async () => {
  const argumentChoices = [true, false, undefined];
  for (const argument of argumentChoices) {
    const store = await createStore();
    await store.use({
      async install(store) {
        store.state.foo = undefined;
      },
    });
    await store.use({
      install: () => {},
      async reconciliate(store) {
        await promiseTimeout(30);
        store.state.foo = 'bar';
      },
    });
    await store.use({
      install: () => {},
      async reconciliate(store) {
        store.state.foo = 'baz';
      },
    });
    await store.reconciliate(argument);
    const expected = true === argument ? 'baz' : 'bar';
    expect(store.state.foo).toBe(expected);
  }
});
