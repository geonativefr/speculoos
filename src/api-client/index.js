import { whenever } from '@vueuse/core';
import { HttpError } from './errors/HttpError.js';
import { AbortError } from './errors/AbortError.js';
import { isRef, unref } from 'vue';
import clone from 'clone-deep';
import md5 from 'md5';

const normalizeHeaders = (headers) => {
  if (!(headers instanceof Headers)) {
    return headers;
  }
  const output = {};
  for (let key of headers.keys()) {
    output[key] = headers.get(key);
  }

  return output;
};

const defaultHeaders = {
  Accept: 'application/ld+json, application/json',
};

const tapResponse = async (response) => {
  try {
    const body = await response.text();
    try {
      response.data = JSON.parse(body);
      response.json = () => new Promise(resolve => resolve(response.data));
    } catch (e) {
      response.data = body;
      response.json = () => new Promise(resolve => resolve(response.data));
    }
  } catch (e) {
    // ignore
  }

  return response;
};

export class ApiClient {
  baseUri;
  options;
  fetch;
  constructor({baseUri = '', options = {}, fetcher} = {}) {
    this.baseUri = baseUri;
    this.options = options;
    fetcher = fetcher ?? window.fetch?.bind(window);
    this.fetch = async (url, options) => fetcher(url, options).then(tapResponse);
  }

  resolve(uri) {
    return new URL(uri, this.baseUri).toString();
  }

  mergeOptions(options) {
    let output = {...this.options};
    if (Object.keys(output).includes('headers')) {
      output.headers = normalizeHeaders(output.headers);
    }
    for (let argument of arguments) {
      let options = {...argument};
      if (Object.keys(options).includes('headers')) {
        options.headers = {...normalizeHeaders(options.headers)};
      }
      output = {...clone(output), ...clone(options)};
    }

    return output;
  }

  async request(method, url, options) {
    url = `${unref(url)}`; // Ensure string
    options = this.mergeOptions({method}, options);
    if (Object.keys(options).includes('headers')) {
      options.headers = new Headers({...defaultHeaders, ...normalizeHeaders(options.headers)});
    }
    try {
      if (isRef(options?.isLoading)) {
        options.isLoading.value = true;
      }
      if (isRef(options?.aborted)) {
        const controller = new AbortController();
        const { signal } = controller;
        options.signal = signal;
        whenever(options.aborted, () => controller.abort(), {immediate: true});
      }
      try {
        const response = await this.fetch(url, options);
        return HttpError.guard(response);
      } catch (e) {
        if ('AbortError' === e.name) {
          throw new AbortError(e.reason);
        }
        throw e;
      }
    } finally {
      if (isRef(options?.isLoading)) {
        options.isLoading.value = false;
      }
    }
  }

  async get(uri, options = {}) {
    return await this.request('GET', this.resolve(uri), this.mergeOptions(options));
  }

  async post(uri, data, options = {}) {
    return await this.request('POST', this.resolve(uri), this.mergeOptions(
      {
        body: JSON.stringify(unref(data)),
        headers: {
          'Content-Type': 'application/json',
        }
      },
      options
    ));
  }

  async put(uri, data, options = {}) {
    return await this.request('PUT', this.resolve(uri), this.mergeOptions(
      {
        body: JSON.stringify(unref(data)),
        headers: {
          'Content-Type': 'application/json',
        }
      },
      options
    ));
  }

  async delete(uri, options = {}) {
    return await this.request('DELETE', this.resolve(uri), this.mergeOptions(options));
  }
}

class PreventDuplicates {
  fetch;
  pendingRequests = [];

  removePendingRequest(hash) {
    const index = this.pendingRequests.findIndex(pending => hash === pending.hash);
    if (index >= 0) {
      this.pendingRequests.splice(index, 1);
    }
  }

  constructor(fetcher = window.fetch?.bind(window)) {
    this.fetch = fetcher;
    return (url, options) => {
      try {
        const hash = md5(JSON.stringify({url, ...options}));
        const index = this.pendingRequests.findIndex(pending => hash === pending.hash);
        if (index >= 0) {
          return this.pendingRequests[index].promise;
        }
        const promise = this.fetch(url, options).then(tapResponse);
        this.pendingRequests.push({hash, promise});
        return promise.then(
          (result) => {
            this.removePendingRequest(hash);
            return result;
          },
          (error) => {
            this.removePendingRequest(hash);
            throw error;
          }
        );
      } catch (e) {
        return this.fetch(url, options);
      }
    };
  }
}

export function withoutDuplicates(fetcher = undefined) {
  return new PreventDuplicates(fetcher);
}

export { HttpError } from './errors/HttpError.js';
export { AbortError } from './errors/AbortError.js';
