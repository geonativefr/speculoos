import { reactive, readonly, inject } from 'vue';

export const createStore = async ({state = {}, methods = {}, name = 'store'} = {}) => {
  state = reactive(state);
  const plugins = [];

  const store = {
    name,
    state,
    ...Object.keys(methods).reduce(function(resolvedMethods, name) {
      const func = methods[name];
      resolvedMethods[name] = function () {
        return func(state, ...arguments);
      };
      return resolvedMethods;
    }, {}),
    async use(plugin) {
      plugins.push(plugin);
      await plugin.install(this);
      return this;
    },
    async reconciliate(sequentially = false) {
      const reconcilablePlugins = plugins.filter(({reconciliate}) => 'function' === typeof reconciliate);
      if (false === sequentially) {
        return Promise.all(reconcilablePlugins.map(plugin => plugin.reconciliate(this)));
      }
      for (const plugin of reconcilablePlugins) {
        await plugin.reconciliate(this);
      }
    },
  };

  store.install = app => app.provide(name, {...store, state: readonly(state)});

  return store;
};

export const useStore = (name = 'store') => inject(name);
