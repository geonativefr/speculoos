import Filter from './filter.js';
import { ref, unref } from 'vue';
import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';
import { clone } from '../clone/index.js';

function isBlank(val) {

  if (null == val) {
    return true;
  }

  if ('string' == typeof val) {
    return val.trim().length === 0;
  }

  if ('function' == typeof val) {
    return val.length === 0;
  }

  if (Array.isArray(val)) {
    return val.length === 0;
  }

  if (val instanceof Object) {
    return Object.keys(val).length === 0;
  }

  return false;
}

function deepPrune(input) {
  if (!(input instanceof Object)) {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map(deepPrune);
  }

  const output = {...input};
  Object.keys(output).forEach(key => {
    if (output[key] instanceof Object) {
      output[key] = deepPrune(output[key]);
    }
    if (isBlank(output[key])) {
      delete output[key];
    }
  });

  return output;
}

function isPlainObject(value) {
  if ('object' !== typeof value || null == value) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);

  return null == prototype || Object.prototype === prototype;
}

// A plain object that holds a function, such as a store, is a reference the filter uses, not filter data.
function isData(value) {
  return isPlainObject(value) && Object.values(value).every(entry => 'function' !== typeof entry);
}

// Copies the arrays and plain objects a filter holds, so that changing them in place doesn't alter the copy.
function copyState(filter) {
  const state = {};
  Object.keys(filter).forEach(key => {
    const value = filter[key];
    if (Array.isArray(value)) {
      state[key] = [...value];
    } else if (isData(value)) {
      state[key] = {...value};
    } else {
      state[key] = value;
    }
  });

  return state;
}

// Not enumerable, so that cloning or serializing the collection leaves the initial states out.
function setInitialStates(collection, initialStates) {
  Object.defineProperty(collection, '_initialStates', {
    value: initialStates,
    writable: true,
    configurable: true,
    enumerable: false,
  });
}

export class FilterCollection {
  _filters = [];
  constructor(filters = {}) {
    if (!(filters instanceof Object)) {
      throw Error('A FilterCollection expects an object.');
    }
    setInitialStates(this, {});
    Object.keys(filters).forEach(key => {
      if (!(filters[key] instanceof Filter)) {
        throw Error(`Filter ${key} doesn't extend the Filter class.`);
      }
      this[key] = filters[key];
      this._filters.push(key);
      this._initialStates[key] = copyState(filters[key]);
    });
  }

  normalize() {
    const output = {};
    this._filters.forEach(key => {
      const filter = this[key];
      output[key] = filter.normalize();
    });

    // Remove filters with null values
    return deepPrune(output);
  }

  async denormalize(input) {
    const promises = [];
    for (const key of this._filters) {
      const filter = this[key];
      if (!(filter instanceof Filter)) {
        continue;
      }
      if ('undefined' !== typeof input[key]) {
        promises.push(filter.denormalize(input[key]));
      } else if (null != this._initialStates?.[key]) {
        Object.assign(filter, copyState(this._initialStates[key]));
      }
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }

    return this;
  }
}

export async function useFilters(initialState = {}, options = {
  preserveQuery: false,
  targetRoute: undefined,
}) {
  if ('function' !== typeof initialState) {
    throw Error('initialState should be provided as a function.');
  }
  const currentRoute = useRoute();
  const router = useRouter();
  const filters = ref(initialState());

  async function hydrateFiltersFromRoute(route) {
    // Filters missing from the route go back to the initial state as it is now, not as it was on setup.
    setInitialStates(unref(filters), initialState()._initialStates);
    Object.assign(unref(filters), await unref(filters).denormalize(route.query));
  }

  function clear() {
    filters.value = clone(initialState());
  }

  function buildQueryParams(additionalParams = {}) {
    const output = {};
    if (true === options.preserveQuery) {
      Object.assign(output, currentRoute.query);
    }
    return Object.assign(output, unref(filters).normalize(), additionalParams);
  }

  async function submit(additionalParams = {}) {
    const route = unref(options.targetRoute) ?? currentRoute;
    await router.push(Object.assign({...route}, {query: buildQueryParams(additionalParams)}));
  }

  onBeforeRouteUpdate((to) => hydrateFiltersFromRoute(to));
  await hydrateFiltersFromRoute(currentRoute);

  return {
    filters,
    buildQueryParams,
    submit,
    clear,
  };
}
