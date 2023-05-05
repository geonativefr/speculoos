const EVENTSOURCE_READYSTATE_OPEN = 1;
const EVENTSOURCE_READYSTATE_CLOSED = 2;

export class FakeEventSource implements EventSource {
    readyState = EVENTSOURCE_READYSTATE_CLOSED;
    withCredentials: boolean;

    constructor(public url: string, public configuration?: EventSourceInit) {
        this.withCredentials = configuration?.withCredentials ?? false;
    }
    private open() {
        if (this.readyState === EVENTSOURCE_READYSTATE_OPEN) return;
        this.readyState = EVENTSOURCE_READYSTATE_OPEN;
        this.onopen(new Event('open'));
    }
    close() {
        this.readyState = EVENTSOURCE_READYSTATE_CLOSED;
    }
    onerror(this: EventSource, _ev: Event): void {}
    onmessage(this: EventSource, _ev: MessageEvent<any>): void {}
    onopen(this: EventSource, _ev: Event): void {}
    CONNECTING: 0 = 0;
    OPEN: 1 = 1;
    CLOSED: 2 = 2;
    addEventListener<K extends keyof EventSourceEventMap>(
        type: K,
        listener: (this: EventSource, ev: EventSourceEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions | undefined
    ): void;
    addEventListener(
        type: string,
        listener: (this: EventSource, event: MessageEvent<any>) => any,
        options?: boolean | AddEventListenerOptions | undefined
    ): void;
    addEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions | undefined
    ): void;
    addEventListener(_type: unknown, _listener: unknown, _options?: unknown): void {
        throw new Error('Method not implemented.');
    }
    removeEventListener<K extends keyof EventSourceEventMap>(
        type: K,
        listener: (this: EventSource, ev: EventSourceEventMap[K]) => any,
        options?: boolean | EventListenerOptions | undefined
    ): void;
    removeEventListener(
        type: string,
        listener: (this: EventSource, event: MessageEvent<any>) => any,
        options?: boolean | EventListenerOptions | undefined
    ): void;
    removeEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | EventListenerOptions | undefined
    ): void;
    removeEventListener(_type: unknown, _listener: unknown, _options?: unknown): void {
        throw new Error('Method not implemented.');
    }
    dispatchEvent(_event: Event): boolean {
        throw new Error('Method not implemented.');
    }

    triggerEvent(event: any): void {
        this.open();
        this.onmessage(event);
    }

    triggerError(error: any): void {
        this.open();
        this.onerror(error);
    }
}

const isTestEnv = () => (process?.env?.NODE_ENV || (import.meta as any)?.env?.NODE_ENV) === 'test';

export function createEventSource(url: string, configuration?: EventSourceInit): EventSource {
    return isTestEnv() ? new FakeEventSource(url, configuration) : new window.EventSource(url, configuration);
}
