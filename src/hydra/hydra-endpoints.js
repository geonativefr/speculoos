import { QueryString, URI } from 'psr7-js';
import { useStore } from '../store/index.js';

export class HydraEndpoints {
  constructor(data) {
    Object.keys(data).forEach(type => {
      this[type] = new HydraEndpoint(data[type]);
    });
  }

  for(type) {
    if ('string' === typeof type && Object.keys(this).includes(type)) {
      return this[type];
    }

    if (!Object.keys(this).includes(type['@type'])) {
      throw Error(`Endpoint not found for item ${type['@type']}.`);
    }

    return this[type['@type']];
  }
}

export class HydraEndpoint {
  endpoint;
  constructor(endpoint) {
    this.endpoint = endpoint;
  }

  toString() {
    return this.endpoint;
  }

  toJSON() {
    return this.endpoint;
  }

  withQuery(params) {
    const uri = new URI(this.endpoint);
    const qs = new QueryString(uri).withParams(params);
    return new HydraEndpoint(uri.withQuery(qs.toString()).toString());
  }

  paginated(itemsPerPageOrFalse) {
    if (false === itemsPerPageOrFalse) {
      return this.withQuery({
        pagination: 0,
      });
    }

    const pager = {pagination: 1};
    if (itemsPerPageOrFalse) {
      pager.itemsPerPage = itemsPerPageOrFalse;
    }
    return this.withQuery(pager);
  }

  synchronize(location = window.location.href) {
    return this.withQuery(new QueryString(new URI(location)).getParams());
  }
}

/**
 * @returns HydraEndpoint
 */
export const useEndpoint = (endpoint, storeName) => {
  const store = useStore(storeName);
  return store.state.endpoints[endpoint];
};
