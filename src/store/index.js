import { reactive, readonly, inject } from 'vue';

export const createStore = async ({state = {}, methods = {}, name = 'store'} = {}) => {
  state = reactive(state);

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
      await plugin.install(this);
      return this;
    },
  };

  store.install = app => app.provide(name, {...store, state: readonly(state)});

  return store;
};

export const useStore = (name = 'store') => inject(name);
