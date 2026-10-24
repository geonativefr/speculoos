import { createTestApp, getInjectedStore, useSetup } from '../../../vue-tests-setup.js';
import { mercureSync, on, useMercureSync } from '../hydra-mercure.js';
import { Mercure, createMercure, useMercure } from '../../mercure/index.js';
import { effectScope, reactive, ref, unref } from 'vue';
import { createStore, useStore } from '../../store/index.js';
import { HydraPlugin } from '../hydra-plugin.js';

it('updates items', async () => {
  const initialState = reactive({'@id': '/api/foos/1', '@type': 'Foo', name: 'bar', enabled: true});
  const app = createTestApp();
  app.use(createMercure('https://example.org/.well-known/mercure'));
  const item = await useSetup(app, async () => {
    const mercure = useMercure();
    const {synchronize} = useMercureSync();
    synchronize(initialState);
    mercure.connection.triggerEvent({
      data: JSON.stringify({'@id': '/api/foos/1', '@type': 'Foo', enabled: false})
    });
    return initialState;
  });
  expect(item).toEqual({'@id': '/api/foos/1', '@type': 'Foo', name: 'bar', enabled: false});
});

it('deletes items', async () => {
  const store = await getInjectedStore(await (await createStore()).use(new HydraPlugin()));
  const app = createTestApp(store);
  app.use(createMercure('https://example.org/.well-known/mercure'));
  store.storeItem({'@id': '/api/foos/1', '@type': 'Foo', name: 'foo'});
  await useSetup(app, async () => {
    const mercure = useMercure();
    const {synchronize} = useMercureSync();
    const store = useStore();
    const initialState = store.getItem('/api/foos/1');
    synchronize(initialState, undefined, undefined, (iri) => store.removeItem(iri));
    mercure.connection.triggerEvent({
      data: JSON.stringify({'@id': '/api/foos/1'}),
    });
  });
  expect(store.state.items).toHaveLength(0);
});

it('listens to collection updates', async () => {
  const store = await getInjectedStore(await (await createStore()).use(new HydraPlugin()));
  const app = createTestApp(store);
  app.use(createMercure('https://example.org/.well-known/mercure'));
  const item = await useSetup(app, async () => {
    const mercure = useMercure();
    const {on} = useMercureSync();
    const item = ref();
    on('/api/foos/{id}', (update) => item.value = update);
    mercure.connection.triggerEvent({
      data: JSON.stringify({'@id': '/api/foos/1'}),
    });
    return item;
  });
  expect(unref(item)).toEqual({'@id': '/api/foos/1'});
});

describe('listeners cleanup', () => {
  const hub = 'https://example.org/.well-known/mercure';
  const countListeners = (mercure) => (mercure.emitter.all.get('message') ?? []).length;
  const mountWith = (app, setupFn) => {
    app.setup(setupFn);
    app.mount(document.createElement('div'));
    return app;
  };
  const synchronizeInComponent = (options) => {
    const mercure = createMercure(hub);
    const app = mountWith(createTestApp(mercure), () => {
      const {synchronize, on} = useMercureSync(undefined, options);
      synchronize(reactive({'@id': '/api/foos/1', name: 'foo'}), '/api/foos/1');
      on('/api/bars/{id}', () => {});
    });
    expect(countListeners(mercure)).toBe(2);
    app.unmount();
    return mercure;
  };

  it('removes the listeners on unmount by default', () => {
    expect(countListeners(synchronizeInComponent())).toBe(0);
  });

  it('removes the listeners on unmount when the options leave the key out', () => {
    expect(countListeners(synchronizeInComponent({}))).toBe(0);
  });

  it('keeps the listeners on unmount when asked to', () => {
    expect(countListeners(synchronizeInComponent({removeListenersOnUnmount: false}))).toBe(2);
  });

  it('keeps the topics subscribed on unmount', () => {
    expect(unref(synchronizeInComponent().subscribedTopics)).toEqual(['/api/foos/1', '/api/bars/{id}']);
  });

  it('removes the listeners when the effect scope is disposed', () => {
    const mercure = new Mercure(hub);
    const scope = effectScope();
    scope.run(() => {
      const {synchronize} = useMercureSync(mercure);
      synchronize(reactive({'@id': '/api/foos/1', name: 'foo'}), '/api/foos/1');
    });
    expect(countListeners(mercure)).toBe(1);
    scope.stop();
    expect(countListeners(mercure)).toBe(0);
  });
});

describe('items synchronization', () => {
  const hub = 'https://example.org/.well-known/mercure';
  const update = (mercure, data) => mercure.connection.triggerEvent({data: JSON.stringify(data)});

  it('follows a ref of an array replaced after the call', () => {
    const mercure = new Mercure(hub);
    const items = ref([reactive({'@id': '/api/foos/1', name: 'old'})]);
    mercureSync(mercure, items);
    items.value = [reactive({'@id': '/api/foos/2', name: 'old'})];
    update(mercure, {'@id': '/api/foos/2', name: 'new'});
    expect(unref(items)[0].name).toBe('new');
  });

  it('follows a ref of an item', () => {
    const mercure = new Mercure(hub);
    const item = ref(reactive({'@id': '/api/foos/1', name: 'old'}));
    mercureSync(mercure, item);
    update(mercure, {'@id': '/api/foos/1', name: 'new'});
    expect(unref(item).name).toBe('new');
  });

  it('parses each message once for all the listeners', () => {
    const mercure = new Mercure(hub);
    const item = reactive({'@id': '/api/foos/1', name: 'old'});
    const received = [];
    mercureSync(mercure, item);
    on(mercure, '/api/foos/{id}', (update) => received.push(update));
    mercure.addListener((event) => received.push(event));
    const event = {data: JSON.stringify({'@id': '/api/foos/1', name: 'new'})};
    const parse = jest.spyOn(JSON, 'parse');
    try {
      mercure.connection.triggerEvent(event);
      expect(parse).toHaveBeenCalledTimes(1);
    } finally {
      parse.mockRestore();
    }
    expect(item.name).toBe('new');
    expect(received).toEqual([{'@id': '/api/foos/1', name: 'new'}, event]);
    expect(received[1]).toBe(event);
  });
});
