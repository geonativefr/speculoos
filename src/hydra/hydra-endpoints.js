import { QueryString, URI } from 'psr7-js';
import { useStore } from '../store/index.js';
import { unref } from 'vue';

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

  buildIri(id) {
    let uri =  new URI(this.endpoint);
    uri = uri.withPath(`${uri.getPath()}/${id}`);
    return uri.toString();
  }

  withQuery(params) {
    const uri = new URI(this.endpoint);
    const qs = new QueryString(uri).withParams(params);
    return new HydraEndpoint(uri.withQuery(qs.toString()).toString());
  }

  paginated(itemsPerPageOrFalse, partial = false) {
    itemsPerPageOrFalse = unref(itemsPerPageOrFalse);
    partial = unref(partial);

    const pager = {
      pagination: false === itemsPerPageOrFalse ? 0 : 1,
      partial: false === partial ? undefined : 1,
      itemsPerPage: undefined,
    };

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
