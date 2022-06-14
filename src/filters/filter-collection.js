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

export class FilterCollection {
  _filters = [];
  constructor(filters = {}) {
    if (!(filters instanceof Object)) {
      throw Error('A FilterCollection expects an object.');
    }
    Object.keys(filters).forEach(key => {
      if (!(filters[key] instanceof Filter)) {
        throw Error(`Filter ${key} doesn't extend the Filter class.`);
      }
      this[key] = filters[key];
      this._filters.push(key);
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

  async denormalize(input, options) {
    for (const key of this._filters) {
      if ('undefined' !== typeof input[key]) {
        this[key] = await Object.getPrototypeOf(this[key]).constructor.denormalize(input[key], options);
      }
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
    Object.assign(unref(filters), await unref(filters).denormalize(route.query, options));
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
