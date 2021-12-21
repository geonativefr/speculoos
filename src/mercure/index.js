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

  constructor(hub, options = {}) {
    Object.assign(this, {hub, options: reactive(options)});
    this.subscribedTopics = ref([]);
    this.endpoint = computed(() => {
      const url = new URL(this.hub);
      unref(this.subscribedTopics).forEach(topic => url.searchParams.append('topic', topic));
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
    return this.emitter.on('mercure', callback);
  }

  removeListener(callback) {
    return this.emitter.off('mercure', callback);
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
    this.connection.onmessage = event => this.emitter.emit('mercure', event);
  }

  stop() {
    this.connection?.close();
    this.connection = undefined;
  }
}

export * from './event-source.js';
export * from './mercure-plugin.js';
