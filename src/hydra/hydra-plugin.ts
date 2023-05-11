import { checkValidItem, getIri, getItemByIri, hasIri } from './iri-functions';
import { reactive, readonly, ref } from 'vue';
import { HydraCollection } from './factories/hydra-collection';
import { HydraError } from './factories/hydra-error';
import { ConstraintViolationList } from './factories/constraint-violation-list';
import { asyncComputed, until } from '@vueuse/core';
import { HydraEndpoints } from './hydra-endpoints';
import { URI, QueryString } from 'psr7-js';
import { ClassMap, Collection, Item } from '../model';
import { ApiClient, ApiClientOptions } from '../api-client';

interface LightStore {
    state: {
        items: any;
    };
}

type ErrorHandler = (error: Error) => never;
type FecthOptions = ApiClientOptions & { groups?: any; store?: boolean; errorHandler?: ErrorHandler };
type RelationOptions = FecthOptions & { useExisting?: boolean; force?: boolean };
type ApiOutput = Promise<{ data: Item }>;

const DEFAULT_CLASSMAP = {
    'hydra:Collection': HydraCollection,
    'hydra:Error': HydraError,
    ConstraintViolationList: ConstraintViolationList,
};

class Items {
    get length(): number {
        return Array.from(this).length;
    }

    forEach(callback: (value: any, index: number, array: any[]) => void): void {
        Array.from(this).forEach(callback);
    }

    map<T>(callback: (value: any, index: number, array: any[]) => T): T[] {
        return Array.from(this).map(callback);
    }

    filter<T>(callback: (value: any, index: number, array: any[]) => value is any): T[] {
        return Array.from(this).filter(callback);
    }

    find<T>(callback: (value: any, index: number, array: any[]) => value is any): T {
        return Array.from(this).find(callback);
    }

    findIndex(callback: (value: any, index: number, array: any[]) => unknown): number {
        return Array.from(this).findIndex(callback);
    }

    *[Symbol.iterator](): any {
        yield* Object.values(this);
    }
}

const DEFAULT_ERROR_HANDLER = function (error: Error) {
    throw error;
};

export class HydraPlugin {
    endpoints;
    classmap: ClassMap;
    errorHandler;

    constructor(
        private api: ApiClient,
        options: { endpoints?: Object; classmap?: ClassMap; errorHandler?: ErrorHandler } = {}
    ) {
        const { endpoints, classmap } = options;
        this.endpoints = new HydraEndpoints(endpoints ?? {});
        this.classmap = { ...DEFAULT_CLASSMAP, ...classmap };
        this.errorHandler = options.errorHandler ?? DEFAULT_ERROR_HANDLER;
    }

    factory<T extends Item>(item: T, statusCode?: number): T {
        for (const type in this.classmap) {
            if (type === (item['@type'] ?? item)) {
                const className = this.classmap[type];
                if (item instanceof className) {
                    return item;
                }

                item = Object.assign(new className(), item);
                if (statusCode) {
                    Object.assign(item, { statusCode });
                }
                return reactive(item) as T;
            }
        }

        return item;
    }

    storeItem({ state }: LightStore, item: Item): Item | null {
        const iri = getIri(item);
        if (null === iri) return null;
        if (iri && !Object.keys(state.items).includes(iri)) {
            state.items[iri] = ref(item);
        } else {
            Object.assign(state.items[iri], item);
        }
        return state.items[iri];
    }

    removeItem({ state }: LightStore, item: Item): void {
        const iri = getIri(item);
        if (!iri) return;
        delete state.items[iri];
    }

    async clearItems({ state }: LightStore): Promise<void> {
        state.items = reactive(new Items());
    }

    async handle(
        call: () => Promise<{ data: Item }>,
        { errorHandler = this.errorHandler }: { errorHandler?: ErrorHandler } = {}
    ): Promise<Item> | never {
        try {
            const { data } = await call();
            return this.factory(data);
        } catch (error: any) {
            if ('object' === typeof error.response?.data && null != error.response?.data) {
                // eslint-disable-next-line no-ex-assign
                error = this.factory(error.response.data, error.response?.status);
            }
            error.statusCode = error.statusCode ?? error.response?.status;
            return errorHandler(error);
        }
    }

    async fetchItem({ state }: LightStore, itemOrIri: Item | string, options?: FecthOptions): Promise<Item | null> {
        let uri = new URI(getIri(itemOrIri));
        if (options?.groups) {
            uri = uri.withQuery(`${new QueryString(uri.getQuery()).withParam('groups', options.groups)}`);
        }
        let item = await this.handle(() => this.api.get(`${uri}`, options) as ApiOutput, options);
        item = this.factory(item);
        const shouldStore = options?.store ?? true;
        return shouldStore ? this.storeItem({ state }, item) : item;
    }

    async getItem({ state }: LightStore, itemOrIri: Item | string, options?: FecthOptions): Promise<Item | null> {
        if (!itemOrIri) return null;

        const iri = getIri(itemOrIri);
        if (!iri) return null;

        const existingItem = getItemByIri(state.items, iri);
        if (null != existingItem) {
            return existingItem;
        }
        return await this.fetchItem({ state }, iri, options);
    }

    async fetchCollection(
        { state }: LightStore,
        iri: string,
        options?: FecthOptions
    ): Promise<Collection | null | never> {
        let uri = new URI(`${iri}`);
        if (options?.groups) {
            uri = uri.withQuery(`${new QueryString(uri.getQuery()).withParam('groups', options.groups)}`);
        }
        const data = (await this.handle(() => this.api.get(`${uri}`, options) as ApiOutput, options)) as Collection;
        if (!data) return null;
        if (!data['hydra:member']) throw `${data} is not an hydra colletion`;

        data['hydra:member'] = data['hydra:member'].map((item) => this.factory(item));
        const collection = this.factory(data);
        collection['hydra:member'] = collection['hydra:member'].map((item) => this.factory(item));
        const shouldStore = options?.store ?? false;
        if (shouldStore) {
            for (const item of collection['hydra:member']) {
                this.storeItem({ state }, item);
            }
        }
        return collection;
    }

    async createItem({ state }: LightStore, item: Item, options?: FecthOptions): Promise<Item | null> {
        const endpoint = this.endpoints.for(item);
        item = await this.handle(() => this.api.post(endpoint, item, options) as ApiOutput, options);
        const shouldStore = options?.store ?? true;
        return shouldStore ? this.storeItem({ state }, item) : item;
    }

    async updateItem({ state }: LightStore, item: Item, options?: FecthOptions): Promise<Item | null> {
        checkValidItem(item);
        const iri = getIri(item);
        if (!iri) return null;

        item = await this.handle(() => this.api.put(iri, item, options) as ApiOutput, options);
        const shouldStore = options?.store ?? true;
        return shouldStore ? this.storeItem({ state }, item) : item;
    }

    async upsertItem({ state }: LightStore, item: Item, options?: FecthOptions): Promise<Item | null> {
        return hasIri(item) ? this.updateItem({ state }, item, options) : this.createItem({ state }, item, options);
    }

    async deleteItem({ state }: LightStore, item: Item, options?: FecthOptions): Promise<void> {
        const iri = getIri(item);
        if (!iri) return;

        await this.handle(() => this.api.delete(iri, options) as ApiOutput, options);
        const _item = getItemByIri(state.items, iri);
        if (_item) this.removeItem({ state }, _item);
    }

    async getRelation(
        { state }: LightStore,
        itemOrIri: Item | string | (() => Item | string),
        options?: RelationOptions
    ): Promise<Item | null> {
        if (null === itemOrIri) {
            return null;
        }

        if ('function' === typeof itemOrIri) {
            const synchronizedRelation = asyncComputed(() => this.getRelation({ state }, itemOrIri(), options));
            await until(synchronizedRelation).not.toBe(undefined);
            return synchronizedRelation.value;
        }

        if (true === (options?.useExisting ?? true)) {
            const existingItem = getItemByIri(state.items, itemOrIri);
            if (null != existingItem) {
                return existingItem;
            }
        }

        if ('object' === typeof itemOrIri && false === (options?.force ?? false)) {
            const item = this.factory(itemOrIri);
            const shouldStore = options?.store ?? false;
            return shouldStore ? this.storeItem({ state }, item) : item;
        }

        return await this.getItem({ state }, itemOrIri, options);
    }

    async getRelations(
        { state }: LightStore,
        itemsOrIris: (string | Item)[] | (() => (string | Item)[]),
        options: RelationOptions
    ): Promise<(Item | null)[]> {
        if ('function' === typeof itemsOrIris) {
            const synchronizedRelations = asyncComputed(() => this.getRelations({ state }, itemsOrIris(), options));
            await until(synchronizedRelations).toMatch((x) => !!x);
            return synchronizedRelations.value;
        }
        return Promise.all(itemsOrIris.map((itemOrIri) => this.getRelation({ state }, itemOrIri, options)));
    }

    async install(store: LightStore) {
        store.state.items = reactive(new Items());
        store.state.endpoints = readonly(this.endpoints);
        store.state.classmap = readonly(this.classmap);
        store.storeItem = (item) => this.storeItem(store, item);
        store.removeItem = (item) => this.removeItem(store, item);
        store.clearItems = () => this.clearItems(store);
        store.getItem = (itemOrIri, options) => this.getItem(store, itemOrIri, options);
        store.fetchItem = (iri, options) => this.fetchItem(store, iri, options);
        store.fetchCollection = (iri, options) => this.fetchCollection(store, iri, options);
        store.createItem = (item, options) => this.createItem(store, item, options);
        store.updateItem = (item, options) => this.updateItem(store, item, options);
        store.upsertItem = (item, options) => this.upsertItem(store, item, options);
        store.deleteItem = (itemOrIri, options) => this.deleteItem(store, itemOrIri, options);
        store.getRelation = (itemOrIri, options) => this.getRelation(store, itemOrIri, options);
        store.getRelations = (itemsOrIris, options) => this.getRelations(store, itemsOrIris, options);
        store.endpoint = (name) => store.state.endpoints[name];
        store.getItemsByType = (type) => store.state.items.filter((item) => type === item['@type']);
        store.factory = (typeOrObject, object) => {
            object = object ?? typeOrObject;
            if ('string' === typeof typeOrObject) {
                object['@type'] = typeOrObject;
            }
            return this.factory(object);
        };
    }
}

export * from './factories/constraint-violation-list.js';
export * from './factories/hydra-collection.js';
export * from './factories/hydra-error.js';
