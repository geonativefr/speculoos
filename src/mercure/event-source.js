let EventSource;
const EVENTSOURCE_READYSTATE_OPEN = 1;
const EVENTSOURCE_READYSTATE_CLOSED = 2;

export class FakeEventSource {
  readyState = EVENTSOURCE_READYSTATE_OPEN;
  url;
  withCredentials;
  onerror() {}
  onmessage() {}
  onopen() {}
  close() {
    this.readyState = EVENTSOURCE_READYSTATE_CLOSED;
  }
  constructor(url, configuration) {
    this.url = url;
    this.withCredentials = configuration?.withCredentials ?? false;
    setTimeout(() => this.onopen(), 10);
  }

  triggerEvent(event) {
    this.onmessage(event);
  }

  triggerError(error) {
    this.onerror(error);
  }
}

const isTestEnv = () => {
  if ('undefined' !== typeof process && 'test' === process?.env?.NODE_ENV) {
    return true;
  }
  if ('test' === import.meta?.env?.NODE_ENV) {
    return true;
  }

  return false;
};

if (isTestEnv()) {
  EventSource = FakeEventSource;
} else {
  EventSource = window.EventSource;
}

export default EventSource;
