import { whenever } from '@vueuse/core';
import { HttpError } from './errors/HttpError.js';
import { AbortError } from './errors/AbortError.js';
import { isRef, unref } from 'vue';
import clone from 'clone-deep';
import md5 from 'md5';

type ApiClientUrl = string | URL;

interface ApiClientResponse<T> extends Response {
    data?: T | string;
}

interface ApiClientInterface {
    baseUri?: ApiClientUrl;
    options?: RequestInit;
    fetcher?: Fetcher;
}

interface ApiClientOptions extends RequestInit {
    isLoading?: boolean;
    aborted?: boolean;
}

type Fetcher = (input: ApiClientUrl, options?: RequestInit) => Promise<Response>;

function normalizeHeaders(headers: HeadersInit): HeadersInit {
    if (!(headers instanceof Headers)) {
        return headers;
    }
    const output: HeadersInit = {};
    for (let key of headers.keys()) {
        const header = headers.get(key);
        if (header !== null) output[key] = header;
    }

    return output;
}

const defaultHeaders = {
    Accept: 'application/ld+json, application/json',
};

async function tapResponse<T>(response: ApiClientResponse<T>): Promise<ApiClientResponse<T>> {
    try {
        const body = await response.text();
        try {
            response.data = JSON.parse(body);
            response.json = () => new Promise((resolve) => resolve(response.data));
        } catch (e) {
            response.data = body;
            response.json = () => new Promise((resolve) => resolve(response.data));
        }
    } catch (e) {
        // ignore
    }

    return response;
}

export class ApiClient {
    baseUri: ApiClientUrl;
    options: ApiClientOptions;
    fetch;
    constructor({ baseUri = '', options = {}, fetcher = window.fetch.bind(window) }: ApiClientInterface = {}) {
        this.baseUri = baseUri;
        this.options = options;
        this.fetch = async (url: ApiClientUrl, options: ApiClientOptions) => fetcher(url, options).then(tapResponse);
    }

    resolve(uri: ApiClientUrl): string {
        return new URL(uri, this.baseUri).toString();
    }

    mergeOptions(...args: ApiClientOptions[]): ApiClientOptions {
        let output = { ...this.options };
        if (output.headers) {
            output.headers = normalizeHeaders(output.headers);
        }
        for (let argument of args) {
            const options = { ...argument };
            if (options.headers) {
                options.headers = { ...normalizeHeaders(options.headers) };
            }
            output = { ...clone(output), ...clone(options) };
        }

        return output;
    }

    async request<T>(method: string, url: RequestInfo, options: ApiClientOptions): Promise<ApiClientResponse<T>> {
        url = `${unref(url)}`; // Ensure string
        options = this.mergeOptions({ method }, options);
        options.headers = { ...defaultHeaders, ...normalizeHeaders(options.headers || []) };
        try {
            if (isRef(options?.isLoading)) {
                options.isLoading.value = true;
            }
            if (isRef(options?.aborted)) {
                const controller = new AbortController();
                const { signal } = controller;
                options.signal = signal;
                whenever(options.aborted, () => controller.abort(), { immediate: true });
            }
            try {
                const response = await this.fetch(url, options);
                return HttpError.guard(response);
            } catch (e: any) {
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

    async get<T>(uri: ApiClientUrl, options: ApiClientOptions = {}): Promise<ApiClientResponse<T>> {
        return await this.request('GET', this.resolve(uri), this.mergeOptions(options));
    }

    async post<T>(uri: ApiClientUrl, data: any, options = {}): Promise<ApiClientResponse<T>> {
        return await this.request(
            'POST',
            this.resolve(uri),
            this.mergeOptions(
                {
                    body: JSON.stringify(unref(data)),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
                options
            )
        );
    }

    async put<T>(uri: ApiClientUrl, data: any, options = {}): Promise<ApiClientResponse<T>> {
        return await this.request(
            'PUT',
            this.resolve(uri),
            this.mergeOptions(
                {
                    body: JSON.stringify(unref(data)),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
                options
            )
        );
    }

    async delete<T>(uri: ApiClientUrl, options: ApiClientOptions = {}): Promise<ApiClientResponse<T>> {
        return await this.request('DELETE', this.resolve(uri), this.mergeOptions(options));
    }
}

interface PendingRequest<T> {
    hash: string;
    promise: Promise<T>;
}

export function withoutDuplicates(fetcher = window.fetch.bind(window)): Fetcher {
    const pendingRequests: PendingRequest<Response>[] = [];

    const removePendingRequest = (hash: string) => {
        const index = pendingRequests.findIndex((pending) => hash === pending.hash);
        if (index >= 0) {
            pendingRequests.splice(index, 1);
        }
    };

    return (url: ApiClientUrl, options?: RequestInit) => {
        try {
            const hash = md5(JSON.stringify({ url, ...options }));
            const index = pendingRequests.findIndex((pending) => hash === pending.hash);
            if (index >= 0) {
                return pendingRequests[index].promise;
            }
            const promise = fetch(url, options).then(tapResponse);
            pendingRequests.push({ hash, promise });
            return promise.then(
                (result) => {
                    removePendingRequest(hash);
                    return result;
                },
                (error) => {
                    removePendingRequest(hash);
                    throw error;
                }
            );
        } catch (e) {
            return fetcher(url, options);
        }
    };
}

export { HttpError } from './errors/HttpError.js';
export { AbortError } from './errors/AbortError.js';
