import { computed, reactive, ref, unref } from 'vue';
import EventSource from './event-source.js';
import mitt from 'mitt';

function areSameTopicSets(a, b) {
  return a.length === b.length
    && a.every(topic => b.includes(topic));
}

export class Mercure {
  hub;
  options;
  connection;
  subscribedTopics;
  endpoint;
  emitter;
  lastEventId;

  constructor(hub, options = {}) {
    Object.assign(this, {hub, options: reactive(options)});
    this.lastEventId = ref();
    this.subscribedTopics = ref([]);
    this.endpoint = computed(() => {
      const url = new URL(this.hub);
      unref(this.subscribedTopics).forEach(topic => url.searchParams.append('topic', topic));
      if (unref(this.lastEventId)) {
        url.searchParams.append('Last-Event-ID', unref(this.lastEventId));
      }
      return url.toString();
    });
    this.emitter = mitt();
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

  unsubscribe(topics) {
    if (!Array.isArray(topics)) {
      topics = [topics];
    }
    this.subscribedTopics.value = this.subscribedTopics.value.filter(subscribedTopic => !topics.includes(subscribedTopic));
    if (this.connection) {
      this.listen();
    }
  }

  addListener(callback) {
    return this.emitter.on('message', callback);
  }

  removeListener(callback) {
    return this.emitter.off('message', callback);
  }

  listen() {
    const subscribedTopics = unref(this.subscribedTopics);
    if (0 === subscribedTopics.length) {
      this.stop();
      return;
    }
    this.connect();
  }

  connect() {
    this.stop();
    this.connection = new EventSource(unref(this.endpoint), this.options);
    this.connection.onopen = () => this.emitter.emit('open', {endpoint: unref(this.endpoint)});
    this.connection.onmessage = event => {
      this.lastEventId.value = event.lastEventId;
      return this.emitter.emit('message', event);
    };
    this.connection.onerror = error => {
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

export * from './event-source.js';
export * from './mercure-plugin.js';
