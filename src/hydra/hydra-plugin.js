import { checkValidItem, getIri, getItemByIri, hasIri } from './iri-functions.js';
import { reactive, readonly, ref, watch } from 'vue';
import { HydraCollection } from './factories/hydra-collection.js';
import { HydraError } from './factories/hydra-error.js';
import { ConstraintViolationList } from './factories/constraint-violation-list.js';
import { asyncComputed, until } from '@vueuse/core';
import { HydraEndpoints } from './hydra-endpoints.js';
import { URI, QueryString } from 'psr7-js';

const DEFAULT_CLASSMAP = {
  'hydra:Collection': HydraCollection,
  'hydra:Error': HydraError,
  'ConstraintViolationList': ConstraintViolationList,
};

class Items {
  constructor() {
    Object.assign(
      this,
      {
        * [Symbol.iterator]() {
          yield* Object.values(this);
        },
      }
    );
  }

  get length() {
    return Array.from(this).length;
  }

  forEach(callback) {
    return Array.from(this).forEach(callback);
  }

  map(callback) {
    return Array.from(this).map(callback);
  }

  filter(callback) {
    return Array.from(this).filter(callback);
  }

  find(callback) {
    return Array.from(this).find(callback);
  }

  findIndex(callback) {
    return Array.from(this).findIndex(callback);
  }
}

const DEFAULT_ERROR_HANDLER = function (error) {
  throw error;
};

export class HydraPlugin {
  api;
  endpoints;
  classmap;

  constructor(api, options = {}) {
    this.api = api;
    const {endpoints, classmap} = options;
    this.endpoints = new HydraEndpoints(endpoints ?? {});
    this.classmap = {...DEFAULT_CLASSMAP, ...classmap};
    this.errorHandler = options.errorHandler ?? DEFAULT_ERROR_HANDLER;
  }

  factory(item, statusCode) {
    for (const type in this.classmap) {
      if (type === (item['@type'] ?? item)) {
        const className = this.classmap[type];
        if (item instanceof className) {
          return item;
        }

        item = Object.assign(new className, item);
        if (statusCode) {
          Object.assign(item, {statusCode});
        }
        return reactive(item);
      }
    }

    return item;
  }

  storeItem({state}, item) {
    const iri = getIri(item);
    if (!Object.keys(state.items).includes(iri)) {
      state.items[iri] = ref(item);
    } else {
      Object.assign(state.items[iri], item);
    }
    return state.items[iri];
  }

  removeItem({state}, item) {
    const iri = getIri(item);
    delete state.items[iri];
  }

  async clearItems({state}) {
    state.items = reactive(new Items());
  }

  async handle(call, {errorHandler = this.errorHandler} = {}) {
    try {
      const {data} = await call();
      return this.factory(data);
    } catch (error) {
      if ('object' === typeof error.response?.data && null != error.response?.data) {
        // eslint-disable-next-line no-ex-assign
        error = this.factory(error.response.data, error.response?.status);
      }
      error.statusCode = error.statusCode ?? error.response?.status;
      errorHandler(error);
    }
  }

  async fetchItem({state}, itemOrIri, options) {
    let uri = new URI(getIri(itemOrIri));
    if (options?.groups) {
      uri = uri.withQuery(`${new QueryString(uri.getQuery()).withParam('groups', options.groups)}`);
    }
    let item = await this.handle(() => this.api.get(`${uri}`, options), options);
    item = this.factory(item);
    const shouldStore = options?.store ?? true;
    return shouldStore ? this.storeItem({state}, item) : item;
  }

  async getItem({state}, itemOrIri, options) {
    if (null === itemOrIri) {
      return null;
    }
    const iri = getIri(itemOrIri);
    const existingItem = getItemByIri(state.items, iri);
    if (null != existingItem) {
      return existingItem;
    }
    return await this.fetchItem({state}, iri, options);
  }

  async fetchCollection({state}, iri, options) {
    let uri = new URI(`${iri}`);
    if (options?.groups) {
      uri = uri.withQuery(`${new QueryString(uri.getQuery()).withParam('groups', options.groups)}`);
    }
    const data = await this.handle(() => this.api.get(`${uri}`, options), options);
    data['hydra:member'] = data['hydra:member'].map(item => this.factory(item));
    const collection = this.factory(data);
    collection['hydra:member'] = collection['hydra:member'].map(item => this.factory(item));
    const shouldStore = options?.store ?? false;
    if (shouldStore) {
      for (const item of collection['hydra:member']) {
        this.storeItem({state}, item);
      }
    }
    return collection;
  }

  async createItem({state}, item, options) {
    const endpoint = this.endpoints.for(item);
    item = await this.handle(() => this.api.post(endpoint, item, options), options);
    const shouldStore = options?.store ?? true;
    return shouldStore ? this.storeItem({state}, item) : item;
  }

  async updateItem({state}, item, options) {
    checkValidItem(item);
    item = await this.handle(() => this.api.put(getIri(item), item, options), options);
    const shouldStore = options?.store ?? true;
    return shouldStore ? this.storeItem({state}, item) : item;
  }

  async upsertItem({state}, item, options) {
    return hasIri(item) ? this.updateItem({state}, item, options) : this.createItem({state}, item, options);
  }

  async deleteItem({state}, item, options) {
    const iri = getIri(item);
    await this.handle(() => this.api.delete(iri, options), options);
    item = getItemByIri(state.items, iri);
    if (null !== item) {
      this.removeItem({state}, item);
    }
  }

  async getRelation({state}, itemOrIri, options = {}) {
    if (null === itemOrIri) {
      return null;
    }

    if ('function' === typeof itemOrIri) {
      const synchronizedRelation = asyncComputed(() => this.getRelation({state}, itemOrIri(), options));
      await until(synchronizedRelation).not.toBe(undefined);
      return synchronizedRelation;
    }

    if (true === (options.useExisting ?? true)) {
      const existingItem = getItemByIri(state.items, itemOrIri);
      if (null != existingItem) {
        return existingItem;
      }
    }

    if ('object' === typeof itemOrIri && false === (options.force ?? false)) {
      const item = this.factory(itemOrIri);
      const shouldStore = options?.store ?? false;
      return shouldStore ? this.storeItem({state}, item) : item;
    }

    return await this.getItem({state}, itemOrIri, options);
  }

  async getRelations({state}, itemsOrIris, options) {
    if ('function' === typeof itemsOrIris) {
      const synchronizedRelations = asyncComputed(() => this.getRelations({state}, itemsOrIris(), options));
      await until(synchronizedRelations).not.toBe(undefined);
      return synchronizedRelations;
    }
    return Promise.all(itemsOrIris.map(itemOrIri => this.getRelation({state}, itemOrIri, options)));
  }

  async install(store) {
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
    store.getItemsByType = (type) => store.state.items.filter(item => type === item['@type']);
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
