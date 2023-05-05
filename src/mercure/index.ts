import { computed, reactive, ref, Ref, unref } from 'vue';
import mitt, { Emitter } from 'mitt';
import { createEventSource } from './event-source.ts';

function areSameTopicSets(a: any[], b: any[]): boolean {
    return a.length === b.length && a.every((topic) => b.includes(topic));
}

export interface MercureOptions extends EventSourceInit {
    reconnectInterval?: number;
}

export class Mercure {
    options: MercureOptions;
    connection?: EventSource;
    subscribedTopics: Ref<string[]> = ref([]);
    emitter: Emitter<any> = mitt();
    lastEventId = ref();
    endpoint = computed(() => {
        const url = new URL(this.hub);
        const subscribedTopics = unref(this.subscribedTopics);
        if (subscribedTopics.includes('*')) {
            url.searchParams.append('topic', '*');
        } else {
            subscribedTopics.forEach((topic) => url.searchParams.append('topic', topic));
        }
        if (unref(this.lastEventId)) {
            url.searchParams.append('Last-Event-ID', unref(this.lastEventId));
        }
        return url.toString();
    });

    constructor(public hub: string, options: MercureOptions = {}) {
        this.options = reactive(options);
    }

    subscribe(topics = ['*'], listen = true) {
        if (!Array.isArray(topics)) {
            topics = [topics];
        }
        const formerTopicSet = Array.from(unref(this.subscribedTopics));
        const newTopicSet = [...new Set([...unref(this.subscribedTopics), ...topics])];
        this.subscribedTopics.value = newTopicSet;
        if (listen && !areSameTopicSets(formerTopicSet, newTopicSet)) {
            this.listen();
        }
    }

    unsubscribe(topics: string[]) {
        if (!Array.isArray(topics)) {
            topics = [topics];
        }
        this.subscribedTopics.value = this.subscribedTopics.value.filter(
            (subscribedTopic) => !topics.includes(subscribedTopic)
        );
        if (this.connection) {
            this.listen();
        }
    }

    addListener(callback: Function) {
        return this.emitter.on('message', callback);
    }

    removeListener(callback: Function) {
        return this.emitter.off('message', callback);
    }

    listen() {
        const subscribedTopics = unref(this.subscribedTopics);
        if (0 === subscribedTopics.length) {
            this.stop();
            return;
        }
        if (!this.connection) {
            this.connect();
        }
    }

    connect() {
        this.stop();
        this.connection = createEventSource(unref(this.endpoint), this.options);
        this.connection.onopen = () => this.emitter.emit('open', { endpoint: unref(this.endpoint) });
        this.connection.onmessage = (event) => {
            this.lastEventId.value = event.lastEventId;
            return this.emitter.emit('message', event);
        };
        this.connection.onerror = (error) => {
            this.emitter.emit('error', error);
            if ('number' === typeof this.options.reconnectInterval) {
                this.stop();
                setTimeout(() => this.connect(), this.options.reconnectInterval);
            }
        };
    }

    stop() {
        this.connection?.close();
        this.connection = undefined;
    }
}

export * from './event-source.ts';
export * from './mercure-plugin.ts';
