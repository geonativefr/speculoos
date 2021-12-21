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
    id: 1,
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
