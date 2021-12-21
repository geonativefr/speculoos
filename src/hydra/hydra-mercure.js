import { areSameIris, getIri, hasIri } from './iri-functions.js';
import { onUnmounted, unref } from 'vue';
import { useMercure } from '../mercure/index.js';
import uriTemplate from 'uri-templates';

const defaultUpdater = (update, item) => Object.assign(item, update);
const defaultRemover = () => {};

export function mercureSync(mercure, items, topics = ['*'], onUpdate = defaultUpdater, onDelete = defaultRemover) {
  if (!Array.isArray(items)) {
    items = [items];
  }
  if (!Array.isArray(topics)) {
    topics = [topics];
  }
  const listener = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (!hasIri(data)) {
        return;
      }
      if (1 === Object.keys(data).length) {
        onDelete(getIri(data));
        return;
      }
      for (const item of items) {
        if (areSameIris(getIri(data), item)) {
          onUpdate(data, unref(item));
        }
      }
    } catch (e) {
      console.debug(e);
    }
  };
  mercure.addListener(listener);
  mercure.subscribe(topics);

  return listener;
}

export const useMercureSync = (mercure) => {
  mercure = mercure ?? useMercure();
  const listeners = [];

  onUnmounted(() => {
    for (const listener of listeners) {
      mercure.removeListener(listener);
    }
  });

  const synchronize = (items, topics = ['*'], onUpdate = defaultUpdater, onDelete = defaultRemover) => {
    listeners.push(mercureSync(mercure, items, topics, onUpdate, onDelete));
  };

  const on = (topics, callback) => {
    if (!Array.isArray(topics)) {
      topics = [topics];
    }
    const wrapper = (event) => {
      try {
        const item = JSON.parse(event.data);
        for (const topic of topics) {
          if ('undefined' !== typeof uriTemplate(topic).fromUri(getIri(item))) {
            callback(item);
            break;
          }
        }
      } catch (e) {
        // Silently ignore
      }
    };
    listeners.push(wrapper);
    mercure.addListener(wrapper);
    mercure.subscribe(topics);
  };

  return {synchronize, on};
};
