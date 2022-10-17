import flushPromises from 'flush-promises';
import { computed, isRef, reactive, ref, unref } from 'vue';
import { createTestApp, getInjectedStore, ShouldNotHappen, useSetup } from '../../../vue-tests-setup.js';
import { ApiClient } from '../../api-client/index.js';
import { mockResponse } from '../../api-client/tests/setup.js';
import { createStore, useStore } from '../../store/index.js';
import { ConstraintViolationList, Violation } from '../factories/constraint-violation-list.js';
import { HydraCollection } from '../factories/hydra-collection.js';
import { HydraPlugin } from '../hydra-plugin.js';

const response = ref();
const fetcher = async () => {
  const _response = unref(response);
  response.value = undefined;
  return _response;
};
const api = new ApiClient({fetcher, baseUri: 'https://example.org'});
const plugin = new HydraPlugin(api);

it('can be installed as a store plugin', async () => {
  const store = await getInjectedStore(await (await createStore()).use(plugin));
  expect(Array.from(store.state.items)).toEqual([]);
  expect(typeof store.storeItem).toBe('function');
  expect(typeof store.removeItem).toBe('function');
  expect(typeof store.getItem).toBe('function');
  expect(typeof store.fetchItem).toBe('function');
  expect(typeof store.fetchCollection).toBe('function');
  expect(typeof store.createItem).toBe('function');
  expect(typeof store.updateItem).toBe('function');
  expect(typeof store.upsertItem).toBe('function');
  expect(typeof store.deleteItem).toBe('function');
  expect(typeof store.getRelation).toBe('function');
  expect(typeof store.getRelations).toBe('function');
});

it('stores an item', async () => {
  const store = await getInjectedStore(await (await createStore()).use(plugin));
  store.storeItem({'@id': '/api/foos/1', name: 'foo'});
  expect(store.state.items).toHaveLength(1);
  expect(Array.from(store.state.items)[0]).toEqual({'@id': '/api/foos/1', name: 'foo'});

  // Update state
  store.storeItem({'@id': '/api/foos/1', name: 'foo', number: 2});
  expect(Array.from(store.state.items)[0]).toEqual({'@id': '/api/foos/1', name: 'foo', number: 2});
});

it('removes an item', async () => {
  const store = await getInjectedStore(await (await createStore()).use(plugin));
  store.storeItem({'@id': '/api/foos/1', name: 'foo'});
  store.storeItem({'@id': '/api/foos/2', name: 'bar'});
  store.storeItem({'@id': '/api/foos/3', name: 'baz'});

  store.removeItem('/api/foos/2');
  expect(store.state.items).toHaveLength(2);

  store.removeItem({'@id': '/api/foos/1'});
  expect(Array.from(store.state.items)).toEqual([{'@id': '/api/foos/3', name: 'baz'}]);
});

it('clears all items', async () => {
  const store = await getInjectedStore(await (await createStore()).use(plugin));
  store.storeItem({'@id': '/api/foos/1', name: 'foo'});
  store.storeItem({'@id': '/api/foos/2', name: 'bar'});
  store.storeItem({'@id': '/api/foos/3', name: 'baz'});

  store.clearItems('/api/foos/2');
  expect(store.state.items).toHaveLength(0);
});

it('fetches an item', async () => {
  let item;
  const storeFactory = await (await createStore()).use(plugin);
  const store = await getInjectedStore(storeFactory);
  item = await useSetup(createTestApp(storeFactory), async () => {
    const store = useStore();
    response.value = mockResponse({body: JSON.stringify({'@id': '/api/foos/1', name: 'foo'})});
    return await store.fetchItem('/api/foos/1');
  });
  expect(item).toEqual({'@id': '/api/foos/1', name: 'foo'});
  expect(Array.from(store.state.items)[0]).toEqual({'@id': '/api/foos/1', name: 'foo'});

  // Performing the same request twice should return the new result
  item = await useSetup(createTestApp(storeFactory), async () => {
    const store = useStore();
    response.value = mockResponse({body: JSON.stringify({'@id': '/api/foos/1', name: 'bar'})});
    return await store.fetchItem('/api/foos/1');
  });
  expect(item).toEqual({'@id': '/api/foos/1', name: 'bar'});
  expect(Array.from(store.state.items)[0]).toEqual({'@id': '/api/foos/1', name: 'bar'});
});

it('gets an item', async () => {
  let item;
  const storeFactory = await (await createStore()).use(plugin);
  const store = await getInjectedStore(storeFactory);
  item = await useSetup(createTestApp(storeFactory), async () => {
    response.value = mockResponse({body: JSON.stringify({'@id': '/api/foos/1', name: 'foo'})});
    return await store.getItem('/api/foos/1');
  });
  expect(item).toEqual({'@id': '/api/foos/1', name: 'foo'});
  expect(Array.from(store.state.items)[0]).toEqual({'@id': '/api/foos/1', name: 'foo'});

  // Performing the same request twice should NOT return the new result (pick from store.state.items)
  item = await useSetup(createTestApp(storeFactory), async () => {
    const store = useStore();
    response.value = mockResponse({body: JSON.stringify({'@id': '/api/foos/1', name: 'bar'})});
    return await store.getItem('/api/foos/1');
  });
  expect(item).toEqual({'@id': '/api/foos/1', name: 'foo'});
  expect(Array.from(store.state.items)[0]).toEqual({'@id': '/api/foos/1', name: 'foo'});
});

it('gets an item only by its IRI, even on an already constructed object', async () => {
  let item;
  const store = await createStore();
  await store.use(plugin);
  response.value = mockResponse({body: JSON.stringify({'@id': '/api/foos/1', name: 'foo'})});
  item = await store.getItem({'@id': '/api/foos/1'});
  expect(item).toEqual({'@id': '/api/foos/1', name: 'foo'});
  expect(Array.from(store.state.items)[0]).toEqual({'@id': '/api/foos/1', name: 'foo'});

  // Performing the same request twice should NOT return the new result (pick from store.state.items)
  response.value = mockResponse({body: JSON.stringify({'@id': '/api/foos/1', name: 'bar'})});
  item = await store.getItem({'@id': '/api/foos/1'});
  expect(item).toEqual({'@id': '/api/foos/1', name: 'foo'});
  expect(Array.from(store.state.items)[0]).toEqual({'@id': '/api/foos/1', name: 'foo'});
});

it('gets a relation', async () => {
  const bar = {
    '@id': '/api/bars/1',
    fooAsIri: '/api/foos/1',
    fooAsObject: {'@id': '/api/foos/1', name: 'temporary name'},
  };
  let item;
  const store = await createStore();
  await store.use(plugin);
  response.value = mockResponse({body: JSON.stringify({'@id': '/api/foos/1', name: 'foo'})});
  item = await store.getRelation(bar.fooAsObject);
  expect(item).toEqual({'@id': '/api/foos/1', name: 'temporary name'});
  expect(Array.from(store.state.items)).toHaveLength(0);

  item = await store.getRelation(bar.fooAsIri);
  expect(item).toEqual({'@id': '/api/foos/1', name: 'foo'});
  expect(Array.from(store.state.items)[0]).toEqual({'@id': '/api/foos/1', name: 'foo'});
});

it('forces calling getItem even if the relation is an object, when asked to', async () => {
  const bar = {
    '@id': '/api/bars/1',
    fooAsIri: '/api/foos/1',
    fooAsObject: {'@id': '/api/foos/1', name: 'temporary name'},
  };
  let item;
  const store = await createStore();
  await store.use(plugin);
  response.value = mockResponse({body: JSON.stringify({'@id': '/api/foos/1', name: 'foo'})});
  item = await store.getRelation(bar.fooAsObject, {force: true});
  expect(item).toEqual({'@id': '/api/foos/1', name: 'foo'});
  expect(Array.from(store.state.items)).toHaveLength(1);

  item = await store.getRelation(bar.fooAsIri);
  expect(item).toEqual({'@id': '/api/foos/1', name: 'foo'});
  expect(Array.from(store.state.items)[0]).toEqual({'@id': '/api/foos/1', name: 'foo'});
});

it('reuses an existing relation by default', async () => {
  const bar = {
    '@id': '/api/bars/1',
    fooAsIri: '/api/foos/1',
    fooAsObject: {'@id': '/api/foos/1', name: 'temporary name'},
  };
  let item;
  const store = await createStore();
  await store.use(plugin);
  response.value = mockResponse({body: JSON.stringify({'@id': '/api/foos/1', name: 'foo'})});
  item = await store.getRelation(bar.fooAsIri);
  expect(item).toEqual({'@id': '/api/foos/1', name: 'foo'});
  expect(Array.from(store.state.items)).toHaveLength(1);

  item = await store.getRelation(bar.fooAsObject);
  expect(item).toEqual({'@id': '/api/foos/1', name: 'foo'});
  expect(Array.from(store.state.items)[0]).toEqual({'@id': '/api/foos/1', name: 'foo'});
});

it('doesn\'t reuse an existing relation when asked to', async () => {
  const bar = {
    '@id': '/api/bars/1',
    fooAsIri: '/api/foos/1',
    fooAsObject: {'@id': '/api/foos/1', name: 'temporary name'},
  };
  let item;
  const store = await createStore();
  await store.use(plugin);
  response.value = mockResponse({body: JSON.stringify({'@id': '/api/foos/1', name: 'foo'})});
  item = await store.getRelation(bar.fooAsIri);
  expect(item).toEqual({'@id': '/api/foos/1', name: 'foo'});
  expect(Array.from(store.state.items)).toHaveLength(1);

  item = await store.getRelation(bar.fooAsObject, {useExisting: false});
  expect(item).toEqual({'@id': '/api/foos/1', name: 'temporary name'});
  expect(Array.from(store.state.items)[0]).toEqual({'@id': '/api/foos/1', name: 'foo'});
});

it('synchronizes ManyToOne relations', async () => {
  const bar = reactive({
    '@id': '/api/bars/1',
    associatedFoo: '/api/foos/1',
  });
  let item;
  const store = await createStore();
  await store.use(plugin);
  response.value = mockResponse({body: JSON.stringify({'@id': '/api/foos/1', name: 'foo1'})});
  item = await store.getRelation(() => bar.associatedFoo);
  expect(isRef(item)).toBeTruthy();
  expect(unref(item)).toEqual({'@id': '/api/foos/1', name: 'foo1'});
  expect(Array.from(store.state.items)[0]).toEqual({'@id': '/api/foos/1', name: 'foo1'});

  response.value = mockResponse({body: JSON.stringify({'@id': '/api/foos/2', name: 'foo2'})});
  bar.associatedFoo = '/api/foos/2';
  await flushPromises();
  expect(unref(item)).toEqual({'@id': '/api/foos/2', name: 'foo2'});
});

it('synchronizes OneToMany relations', async () => {
  const bar = reactive({
    '@id': '/api/bars/1',
    associatedFoos: ['/api/foos/1'],
  });
  let items;
  const store = await createStore();
  await store.use(plugin);
  response.value = mockResponse({body: JSON.stringify({'@id': '/api/foos/1', name: 'foo1'})});
  items = await store.getRelations(() => bar.associatedFoos);
  expect(isRef(items)).toBeTruthy();
  expect(unref(items)).toEqual([{'@id': '/api/foos/1', name: 'foo1'}]);
  expect(Array.from(store.state.items)[0]).toEqual({'@id': '/api/foos/1', name: 'foo1'});

  response.value = mockResponse({body: JSON.stringify({'@id': '/api/foos/2', name: 'foo2'})});
  bar.associatedFoos = ['/api/foos/2'];
  await flushPromises();
  expect(unref(items)).toEqual([{'@id': '/api/foos/2', name: 'foo2'}]);
});

it('fetches a collection', async () => {
  let collection;
  const storeFactory = await (await createStore()).use(plugin);
  const body = {
    '@type': 'hydra:Collection',
    'hydra:member': [
      {'@id': '/api/foos/1', name: 'foo'},
    ],
    'hydra:totalItems': 1000,
  };
  collection = await useSetup(createTestApp(storeFactory), async () => {
    const store = useStore();
    response.value = mockResponse({body: JSON.stringify(body)});
    return await store.fetchCollection('/api/foos');
  });
  expect(collection).toBeInstanceOf(HydraCollection);
  expect(collection.items[0]).toEqual({'@id': '/api/foos/1', name: 'foo'});
  expect(collection.totalItems).toEqual(1000);
});

it('creates an item', async () => {
  const plugin = new HydraPlugin(api, {endpoints: {Foo: '/api/foos'}});
  const storeFactory = await (await createStore()).use(plugin);
  const store = await getInjectedStore(storeFactory);
  const payload = {'@type': 'Foo', name: 'foo'};
  const responseBody = {'@type': 'Foo', '@id': '/api/foos/1', name: 'foo'};
  const item = await useSetup(createTestApp(storeFactory), async () => {
    const store = useStore();
    response.value = mockResponse({body: JSON.stringify(responseBody)});
    return await store.createItem(payload);
  });
  expect(item).toEqual(responseBody);
  expect(Array.from(store.state.items)[0]).toEqual(responseBody);
});

it('updates an item', async () => {
  let item;
  const storeFactory = await (await createStore()).use(plugin);
  const store = await getInjectedStore(storeFactory);
  store.storeItem({'@type': 'Foo', '@id': '/api/foos/1', name: 'foo'});
  const payload = {'@type': 'Foo', '@id': '/api/foos/1', name: 'bar'};
  item = await useSetup(createTestApp(storeFactory), async () => {
    const store = useStore();
    response.value = mockResponse({body: JSON.stringify(payload)});
    return await store.updateItem(payload);
  });
  expect(item).toEqual(payload);
  expect(Array.from(store.state.items)[0]).toEqual(payload);
});

it('deletes an item', async () => {
  const storeFactory = await (await createStore()).use(plugin);
  const store = await getInjectedStore(storeFactory);
  store.storeItem({'@type': 'Foo', '@id': '/api/foos/1', name: 'foo'});
  await useSetup(createTestApp(storeFactory), async () => {
    const store = useStore();
    response.value = mockResponse({status: 204, body: ''});
    return await store.deleteItem('/api/foos/1');
  });
  expect(store.state.items.length).toEqual(0);
});

it('returns a typed object', async () => {
  class Foo {
    name;
  }
  const plugin = new HydraPlugin(
    new ApiClient({fetcher, baseUri: 'https://example.org'}),
    {
      endpoints: {Foo: '/api/foos'},
      classmap: {Foo},
    },
  );
  const storeFactory = await (await createStore()).use(plugin);
  const store = await getInjectedStore(storeFactory);
  await useSetup(createTestApp(storeFactory), async () => {
    const store = useStore();
    response.value = mockResponse({body: JSON.stringify({'@id': '/api/foos/1', '@type': 'Foo', name: 'foo'})});
    return await store.fetchItem('/api/foos/1');
  });
  expect(Array.from(store.state.items)[0]).toEqual({'@id': '/api/foos/1', '@type': 'Foo', name: 'foo'});
  expect(Array.from(store.state.items)[0]).toBeInstanceOf(Foo);
});

it('returns a collection of typed objects', async () => {
  class Foo {
    name;
    get capitalized() {
      return computed(() => this.name.toUpperCase());
    }
  }
  const plugin = new HydraPlugin(
    new ApiClient({fetcher, baseUri: 'https://example.org'}),
    {
      endpoints: {Foo: '/api/foos'},
      classmap: {Foo},
    },
  );
  const storeFactory = await (await createStore()).use(plugin);
  const collection = await useSetup(createTestApp(storeFactory), async () => {
    const store = useStore();
    response.value = mockResponse({body: JSON.stringify({
        '@type': 'hydra:Collection',
        'hydra:member': [
          {
            '@id': '/api/foos/1',
            '@type': 'Foo',
            name: 'foo'
          },
          {
            '@id': '/api/foos/2',
            '@type': 'Foo',
            name: 'bar'
          },
        ],
      })});
    return await store.fetchCollection('/api/foos');
  });
  const items = Array.from(collection);
  expect(items[0]).toBeInstanceOf(Foo);
  expect(items[0].name).toBe('foo');
  expect(items[0].capitalized).toBe('FOO');
  expect(items[1]).toBeInstanceOf(Foo);
  expect(items[1].name).toBe('bar');
  expect(items[1].capitalized).toBe('BAR');
});

it('returns a typed error', async () => {
  const storeFactory = await (await createStore()).use(plugin);
  const store = await getInjectedStore(storeFactory);
  store.storeItem({'@type': 'Foo', '@id': '/api/foos/1', name: 'foo'});
  const requestBody = {'@type': 'Foo', '@id': '/api/foos/1', name: ''};
  const responseBody = {
    '@context': '/api/contexts/ConstraintViolationList',
    '@type': 'ConstraintViolationList',
    'hydra:title': 'An error occurred',
    'hydra:description': 'name: This value should not be blank.',
    'violations': [
      {
        'propertyPath': 'name',
        'message': 'This value should not be blank.',
        'code': 'c1051bb4-d103-4f74-8988-acbcafc7fdc3',
      },
    ],
  };
  try {
    await useSetup(createTestApp(storeFactory), async () => {
      const store = useStore();
      response.value = mockResponse({body: JSON.stringify(responseBody), status: 422});
      return await store.updateItem(requestBody);
    });
  } catch (e) {
    expect(e).toBeInstanceOf(ConstraintViolationList);
    const violations = Array.from(e);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toBeInstanceOf(Violation);
    expect(violations[0].propertyPath).toBe('name');
    expect(violations[0].message).toBe('This value should not be blank.');
    expect(violations[0].code).toBe('c1051bb4-d103-4f74-8988-acbcafc7fdc3');
    return;
  }

  throw ShouldNotHappen;
});

it('filters items by type', async () => {
  const storeFactory = await (await createStore()).use(plugin);
  const store = await getInjectedStore(storeFactory);
  const items = [
    {'@type': 'Foo', '@id': '/api/foos/1', name: 'foo'},
    {'@type': 'Foo', '@id': '/api/foos/2', name: 'foobar'},
    {'@type': 'Bar', '@id': '/api/bars/1', name: 'bar'},
  ];
  items.forEach(store.storeItem);
  const filtered = store.getItemsByType('Foo');
  expect(filtered.length).toBe(2);
  expect(filtered.map(item => item.name)).toEqual(['foo', 'foobar']);
});

it('creates a typed object', async () => {
  let typedItem;
  class Foo {
    name;
  }
  const storeFactory = await (await createStore()).use(new HydraPlugin(undefined, {classmap: {Foo}}));
  const store = await getInjectedStore(storeFactory);

  // When
  typedItem = store.factory({'@type': 'Foo', name: 'foo'});

  // Then
  expect(typedItem).toBeInstanceOf(Foo);
  expect(typedItem.name).toBe('foo');
  expect(typedItem).toEqual({'@type': 'Foo', name: 'foo'});

  // When
  typedItem = store.factory('Foo', {name: 'foo'});

  // Then
  expect(typedItem).toBeInstanceOf(Foo);
  expect(typedItem.name).toBe('foo');
  expect(typedItem).toEqual({'@type': 'Foo', name: 'foo'});
});
