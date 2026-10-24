import { computed, reactive, ref, unref } from 'vue';
import EventSource from './event-source.js';
import mitt from 'mitt';

const MAX_RECONNECT_INTERVAL = 30000;

function areSameTopicSets(a, b) {
  return a.length === b.length
    && a.every(topic => b.includes(topic));
}

function getEffectiveTopics(topics) {
  return topics.includes('*') ? ['*'] : topics;
}

export class Mercure {
  hub;
  options;
  connection;
  subscribedTopics;
  endpoint;
  emitter;
  lastEventId;
  _reconnectTimer;
  _connectedTopics;
  _failedReconnections = 0;

  constructor(hub, options = {}) {
    Object.assign(this, {hub, options: reactive(options)});
    this.lastEventId = ref();
    this.subscribedTopics = ref([]);
    this.endpoint = computed(() => {
      const url = new URL(this.hub);
      const subscribedTopics = unref(this.subscribedTopics);
      if (subscribedTopics.includes('*')) {
        url.searchParams.append('topic', '*');
      } else {
        subscribedTopics.forEach(topic => url.searchParams.append('topic', topic));
      }
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
    if (areSameTopicSets(formerTopicSet, newTopicSet)) {
      return;
    }
    if (this.connection) {
      this._updateConnectionTopics();
    } else if (listen) {
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
      this._updateConnectionTopics();
    }
  }

  /*
   * The topic changes of one synchronous run reconnect once, at the end of the run, and only if the
   * effective topics differ from those of the open connection.
   */
  _updateConnectionTopics() {
    Promise.resolve().then(() => {
      if (!this.connection) {
        return;
      }
      const connectedTopics = getEffectiveTopics(this._connectedTopics);
      if (!areSameTopicSets(connectedTopics, getEffectiveTopics(unref(this.subscribedTopics)))) {
        this.connect();
      }
    });
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
    if (!this.connection) {
      this.connect();
    }
  }

  connect() {
    this.stop();
    const connection = new EventSource(unref(this.endpoint), this.options);
    this.connection = connection;
    this._connectedTopics = Array.from(unref(this.subscribedTopics));
    this.connection.onopen = () => {
      if (connection === this.connection) {
        this._failedReconnections = 0;
      }
      this.emitter.emit('open', {endpoint: unref(this.endpoint)});
    };
    this.connection.onmessage = event => {
      this.lastEventId.value = event.lastEventId;
      return this.emitter.emit('message', event);
    };
    this.connection.onerror = error => {
      this.emitter.emit('error', error);
      if ('number' === typeof this.options.reconnectInterval) {
        this.stop();
        this._reconnectTimer = setTimeout(() => this._reconnect(), this._reconnectDelay());
      }
    };
  }

  /*
   * The first retry waits the reconnection interval, and each consecutive failure doubles it, up to
   * 30 seconds (or the reconnection interval if it is longer).
   */
  _reconnectDelay() {
    const {reconnectInterval} = this.options;
    const delay = Math.min(
      reconnectInterval * 2 ** this._failedReconnections,
      Math.max(MAX_RECONNECT_INTERVAL, reconnectInterval),
    );
    this._failedReconnections++;
    return delay;
  }

  _reconnect() {
    this._reconnectTimer = undefined;
    if (0 < unref(this.subscribedTopics).length) {
      this.connect();
    }
  }

  stop() {
    clearTimeout(this._reconnectTimer);
    this._reconnectTimer = undefined;
    this.connection?.close();
    this.connection = undefined;
  }
}

export * from './event-source.js';
export * from './mercure-plugin.js';
