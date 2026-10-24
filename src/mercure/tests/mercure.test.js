import { Mercure } from '../index.js';
import { FakeEventSource } from '../event-source.js';
import mitt from 'mitt';
import { unref } from 'vue';

it('instantiates a Mercure client', () => {
  const client = new Mercure('https://example.com/.well-known/mercure', {withCredentials: true});
  expect(client.hub).toBe('https://example.com/.well-known/mercure');
  expect(client.options.withCredentials).toBe(true);
  expect(client.subscribedTopics?.value).toEqual([]);
  expect(client.emitter).toBeInstanceOf(mitt().constructor);
});

it('subscribes to topics', () => {
  const client = new Mercure('https://example.org/.well-known/mercure');
  client.subscribe('/api/foos/1');
  client.subscribe(['/api/foos/2', '/api/foos/3']);
  client.subscribe('/api/foos/1');
  expect(unref(client.subscribedTopics)).toEqual([
    '/api/foos/1',
    '/api/foos/2',
    '/api/foos/3',
  ]);
  expect(unref(client.endpoint))
    .toEqual('https://example.org/.well-known/mercure?' +
      'topic=%2Fapi%2Ffoos%2F1' +
      '&topic=%2Fapi%2Ffoos%2F2' +
      '&topic=%2Fapi%2Ffoos%2F3');
  expect(client.connection).toBeInstanceOf(FakeEventSource);
});

it('avoids building complex query strings when wildcard topic is used', () => {
  const client = new Mercure('https://example.org/.well-known/mercure');
  client.subscribe('/api/foos/1');
  client.subscribe(['/api/foos/2', '*', '/api/foos/3']);
  client.subscribe('/api/foos/1');
  client.subscribe('*');
  expect(unref(client.subscribedTopics)).toEqual([
    '/api/foos/1',
    '/api/foos/2',
    '*', // This makes other topics unrelevant
    '/api/foos/3',
  ]);
  expect(unref(client.endpoint)).toEqual('https://example.org/.well-known/mercure?topic=*');
  expect(client.connection).toBeInstanceOf(FakeEventSource);
});

it('subscribes to everything by default', () => {
  const client = new Mercure('https://example.org/.well-known/mercure');
  client.subscribe();
  expect(unref(client.subscribedTopics)).toEqual(['*']);
  expect(unref(client.endpoint)).toEqual('https://example.org/.well-known/mercure?topic=*');
});

it('unsubscribes from topics', () => {
  const client = new Mercure('https://example.org/.well-known/mercure');
  client.subscribe('/api/foos/1');
  client.subscribe(['/api/foos/2', '/api/foos/3']);
  client.unsubscribe('/api/foos/1');
  expect(unref(client.subscribedTopics)).toEqual([
    '/api/foos/2',
    '/api/foos/3',
  ]);
  expect(unref(client.endpoint))
    .toEqual('https://example.org/.well-known/mercure?' +
      'topic=%2Fapi%2Ffoos%2F2' +
      '&topic=%2Fapi%2Ffoos%2F3');
  expect(client.connection).toBeInstanceOf(FakeEventSource);
});

it('listens to updates', () => {
  const client = new Mercure('https://example.com/.well-known/mercure');
  let update = {};
  client.subscribe('/api/foos/foo', false);
  expect(client.connection).toBeUndefined();
  client.listen();
  expect(client.connection).toBeInstanceOf(FakeEventSource);
  client.addListener((event) => Object.assign(update, event));
  client.connection.triggerEvent({
    lastEventId: 1,
    data: JSON.stringify({
      '@id': '/api/foos/foo',
      name: 'foo',
    }),
  });
  expect(update.data).toEqual(JSON.stringify({
    '@id': '/api/foos/foo',
    name: 'foo',
  }));
});

it('closes the connection when requested', () => {
  const client = new Mercure('https://example.com/.well-known/mercure');
  client.subscribe('/api/foos/foo');
  const connection = client.connection;
  expect(client.connection).toBeInstanceOf(FakeEventSource);
  expect(client.connection.readyState).toBe(1);
  client.stop();
  expect(connection.readyState).toBe(2);
  expect(client.connection).toBeUndefined();
});

it('adds a Last-Event-ID query string parameter when reconnecting', async () => {
  jest.useFakeTimers();
  const client = new Mercure('https://example.com/.well-known/mercure', {reconnectInterval: 1000});
  client.subscribe('/api/foos/foo');
  client.connection.triggerEvent({
    lastEventId: 'foo',
    data: JSON.stringify({
      '@id': '/api/foos/foo',
      name: 'foo',
    }),
  });
  client.connection.triggerError(new Error());
  jest.runAllTimers();
  expect(client.connection.url).toBe('https://example.com/.well-known/mercure?topic=%2Fapi%2Ffoos%2Ffoo&Last-Event-ID=foo');
});

it('emits messages', () => {
  jest.useFakeTimers();
  const client = new Mercure('https://example.com/.well-known/mercure');
  const event = {
    lastEventId: 'foo',
    data: JSON.stringify({
      '@id': '/api/foos/foo',
      name: 'foo',
    }),
  };
  let open = false;
  let received;
  let error;
  client.emitter.on('open', () => open = true);
  client.emitter.on('message', (event) => received = event);
  client.emitter.on('error', (e) => error = e);
  client.connect();
  client.connection.triggerEvent(event);
  client.connection.triggerError(new Error('Something wrong occured'));
  jest.runAllTimers();
  expect(open).toBe(true);
  expect(received).toEqual(event);
  expect(error?.message).toBe('Something wrong occured');
});

describe('reconnection', () => {
  const hub = 'https://example.com/.well-known/mercure';

  const failAndWait = (client, delay) => {
    client.connection.triggerError(new Error());
    jest.advanceTimersByTime(delay - 1);
    expect(client.connection).toBeUndefined();
    jest.advanceTimersByTime(1);
    expect(client.connection).toBeInstanceOf(FakeEventSource);
  };

  beforeEach(() => jest.useFakeTimers());

  it('does not reconnect once stopped after an error', () => {
    const client = new Mercure(hub, {reconnectInterval: 1000});
    client.subscribe('/api/foos/foo');
    client.connection.triggerError(new Error());
    client.stop();
    jest.advanceTimersByTime(60000);
    expect(client.connection).toBeUndefined();
  });

  it('does not reconnect once the last topic is unsubscribed after an error', () => {
    const client = new Mercure(hub, {reconnectInterval: 1000});
    client.subscribe('/api/foos/foo');
    client.connection.triggerError(new Error());
    client.unsubscribe('/api/foos/foo');
    jest.advanceTimersByTime(60000);
    expect(client.connection).toBeUndefined();
  });

  it('waits twice as long after each consecutive failure', () => {
    const client = new Mercure(hub, {reconnectInterval: 1000});
    client.subscribe('/api/foos/foo');
    failAndWait(client, 1000);
    failAndWait(client, 2000);
    failAndWait(client, 4000);
  });

  it('caps the delay at 30 seconds, or at the reconnection interval if it is longer', () => {
    const client = new Mercure(hub, {reconnectInterval: 20000});
    client.subscribe('/api/foos/foo');
    failAndWait(client, 20000);
    failAndWait(client, 30000);
    failAndWait(client, 30000);
    client.options.reconnectInterval = 40000;
    failAndWait(client, 40000);
    failAndWait(client, 40000);
  });

  it('waits the reconnection interval again once the connection is open', () => {
    const client = new Mercure(hub, {reconnectInterval: 1000});
    client.subscribe('/api/foos/foo');
    failAndWait(client, 1000);
    failAndWait(client, 2000);
    jest.advanceTimersByTime(10); // The connection opens
    failAndWait(client, 1000);
  });

  it('does not reconnect without a reconnection interval', () => {
    const client = new Mercure(hub);
    client.subscribe('/api/foos/foo');
    const connection = client.connection;
    client.connection.triggerError(new Error());
    jest.advanceTimersByTime(60000);
    expect(client.connection).toBe(connection);
  });
});

describe('topic changes while connected', () => {
  const hub = 'https://example.org/.well-known/mercure';
  const topicsOf = (connection) => new URL(connection.url).searchParams.getAll('topic');
  const flushMicrotasks = () => Promise.resolve();

  it('reconnects to the topics subscribed while connected', async () => {
    const client = new Mercure(hub);
    client.subscribe('/api/foos/1');
    client.subscribe('/api/bars/2');
    await flushMicrotasks();
    expect(topicsOf(client.connection)).toEqual(['/api/foos/1', '/api/bars/2']);
  });

  it('reconnects without the topics unsubscribed while connected', async () => {
    const client = new Mercure(hub);
    client.subscribe(['/api/foos/1', '/api/bars/2']);
    client.unsubscribe('/api/foos/1');
    await flushMicrotasks();
    expect(topicsOf(client.connection)).toEqual(['/api/bars/2']);
  });

  it('reconnects once for the changes of one synchronous run', async () => {
    const client = new Mercure(hub);
    client.subscribe('/api/foos/1');
    const connect = jest.spyOn(client, 'connect');
    client.subscribe('/api/bars/2');
    client.subscribe('/api/bazs/3');
    client.unsubscribe('/api/foos/1');
    await flushMicrotasks();
    expect(connect).toHaveBeenCalledTimes(1);
    expect(topicsOf(client.connection)).toEqual(['/api/bars/2', '/api/bazs/3']);
  });

  it('reconnects to the topics subscribed without listening while connected', async () => {
    const client = new Mercure(hub);
    client.subscribe('/api/foos/1');
    client.subscribe('/api/bars/2', false);
    await flushMicrotasks();
    expect(topicsOf(client.connection)).toEqual(['/api/foos/1', '/api/bars/2']);
  });

  it('does not reconnect when the topics come back to those of the connection', async () => {
    const client = new Mercure(hub);
    client.subscribe('/api/foos/1');
    const connection = client.connection;
    connection.triggerEvent({lastEventId: 'foo', data: '{}'});
    client.subscribe('/api/bars/2');
    client.unsubscribe('/api/bars/2');
    await flushMicrotasks();
    expect(client.connection).toBe(connection);
  });

  it('does not reconnect when the wildcard topic is subscribed', async () => {
    const client = new Mercure(hub);
    client.subscribe('*');
    const connection = client.connection;
    client.subscribe('/api/foos/1');
    await flushMicrotasks();
    expect(client.connection).toBe(connection);
    expect(topicsOf(client.connection)).toEqual(['*']);
  });

  it('does not reconnect once stopped', async () => {
    const client = new Mercure(hub);
    client.subscribe('/api/foos/1');
    client.subscribe('/api/bars/2');
    client.stop();
    await flushMicrotasks();
    expect(client.connection).toBeUndefined();
  });
});
