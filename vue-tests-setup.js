import { createApp, defineComponent, h } from 'vue';
import flushPromises from 'flush-promises';
import { createStore, useStore } from './src/store';

const PENDING_RESULT = '00000000-0000-0000-0000-000000000000';

async function mount(Component, app) {
  const el = document.createElement('div');
  app = app || createApp(Component);

  const unmount = () => app.unmount(el);
  const comp = app.mount(el);
  comp.unmount = unmount;
  return comp;
}

export function createTestApp(plugin) {
  const Component = defineComponent({
    render() {
      return h('div', []);
    },
  });

  const app = createApp(Component);
  for (const plugin of arguments) {
    app.use(plugin);
  }
  return {
    ...app,
    setup(setupFn) {
      app._component.setup = setupFn;
    },
  };
}

export async function useSetup(app, setupFn) {
  let result = PENDING_RESULT;
  app.setup(async () => {
    try {
      result = await setupFn();
    } catch (e) {
      result = e;
    }
    return result;
  });
  mount(app._component, app);
  await flushPromises();
  if (result instanceof Error) {
    throw result;
  }
  return result;
}

export async function getInjectedStore(store) {
  store = store ?? await createStore();
  const app = createTestApp(store);
  return useSetup(app, async () => useStore());
}

export class ShouldNotHappen extends Error {
  constructor() {
    super('This error should not happen.');
  }
}
