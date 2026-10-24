import { areSameIris, getIri, hasIri } from './iri-functions.js';
import { onScopeDispose, unref } from 'vue';
import { useMercure } from '../mercure/index.js';
import uriTemplate from 'uri-templates';

const defaultUpdater = (update, item) => Object.assign(item, update);
const defaultRemover = () => {};

/*
 * Every listener receives the same event: its data is parsed once, and the parsed data (or the parse
 * error) is shared by all of them.
 */
const parsedEvents = new WeakMap();

function parseEventData(event) {
  if (!parsedEvents.has(event)) {
    let parsed;
    try {
      parsed = {data: JSON.parse(event.data)};
    } catch (error) {
      parsed = {error};
    }
    parsedEvents.set(event, parsed);
  }
  const parsed = parsedEvents.get(event);
  if ('error' in parsed) {
    throw parsed.error;
  }
  return parsed.data;
}

export function mercureSync(mercure, items, topics = ['*'], onUpdate = defaultUpdater, onDelete = defaultRemover) {
  if (!Array.isArray(topics)) {
    topics = [topics];
  }
  const listener = (event) => {
    try {
      const data = parseEventData(event);
      if (!hasIri(data)) {
        return;
      }
      if (1 === Object.keys(data).length) {
        onDelete(getIri(data));
        return;
      }
      let currentItems = unref(items);
      if (!Array.isArray(currentItems)) {
        currentItems = [currentItems];
      }
      for (const item of currentItems) {
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

export const on = (mercure, topics, callback) => {
  if (!Array.isArray(topics)) {
    topics = [topics];
  }
  const wrapper = (event) => {
    let item;
    try {
      item = parseEventData(event);
    } catch (e) {
      console.debug(e);
      return;
    }

    if ('object' !== typeof item) {
      console.debug('Received an event which is not an object.');
      return;
    }

    try {
      for (const topic of topics) {
        if ('undefined' !== typeof uriTemplate(topic).fromUri(getIri(item))) {
          callback(item);
          break;
        }
      }
    } catch (e) {
      console.error(e);
    }
  };
  mercure.addListener(wrapper);
  mercure.subscribe(topics);

  return wrapper;
};

export const useMercureSync = (mercure, {removeListenersOnUnmount = true} = {}) => {
  mercure = mercure ?? useMercure();
  const listeners = [];

  if (removeListenersOnUnmount) {
    onScopeDispose(() => {
      for (const listener of listeners) {
        mercure.removeListener(listener);
      }
    });
  }

  const synchronize = (items, topics = ['*'], onUpdate = defaultUpdater, onDelete = defaultRemover) => {
    const listener = mercureSync(mercure, items, topics, onUpdate, onDelete);
    listeners.push(listener);
    return listener;
  };

  return {
    synchronize,
    on(topics, callback) {
      const listener = on(mercure, topics, callback);
      listeners.push(listener);
      return listener;
    },
  };
};
