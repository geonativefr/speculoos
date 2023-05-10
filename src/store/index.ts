import { reactive, readonly, inject, App, Plugin } from 'vue';

export type Store = Plugin & {
    name: string;
    state: Object;
    use: (plugin: StorePlugin) => Promise<Store>;
    reconciliate: (sequentially?: boolean) => Promise<any>;
};

interface StorePlugin {
    install: (plugin: Store) => Promise<void>;
    reconciliate?: (plugin: Store) => Promise<any>;
}

interface ReconcilablePlugin extends StorePlugin {
    reconciliate: (plugin: Store) => Promise<any>;
}

interface FunctionMap {
    [k: string]: Function;
}

interface CreateStoreInterface {
    state?: Object;
    methods?: FunctionMap;
    name?: string;
}

export const createStore = async ({
    state = {},
    methods = {},
    name = 'store',
}: CreateStoreInterface = {}): Promise<Store> => {
    state = reactive(state);
    const plugins: StorePlugin[] = [];

    const store = {
        name,
        state,
        ...Object.keys(methods).reduce(
            (resolvedMethods: FunctionMap, name) => ({
                ...resolvedMethods,
                [name]: (...args: any) => methods[name](state, ...args),
            }),
            {}
        ),
        async use(plugin: StorePlugin) {
            plugins.push(plugin);
            await plugin.install(this);
            return this;
        },
        async reconciliate(sequentially = false): Promise<any> {
            const reconcilablePlugins: ReconcilablePlugin[] = plugins.filter(
                (plugin): plugin is ReconcilablePlugin => !!plugin.reconciliate
            );
            if (false === sequentially) {
                return Promise.all(reconcilablePlugins.map((plugin) => plugin.reconciliate(this)));
            }
            for (const plugin of reconcilablePlugins) {
                await plugin.reconciliate(this);
            }
        },
        install(app: App) {
            return app.provide(name, { ...this, state: readonly(state) });
        },
    };

    return store;
};

export const useStore = (name: string = 'store'): Store => inject(name) as Store;
