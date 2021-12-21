import { createTestApp, getInjectedStore, useSetup } from '../../../vue-tests-setup.js';
import { useMercureSync } from '../hydra-mercure.js';
import { createMercure, useMercure } from '../../mercure/index.js';
import { reactive, ref, unref } from 'vue';
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
