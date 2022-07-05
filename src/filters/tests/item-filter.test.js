import { ItemFilter } from '../item-filter.js';
import { getItemByIri } from '../../hydra/index.js';

const foo = {
  '@id': '/api/foos/1',
  name: 'foo',
};

const bar = {
  '@id': '/api/bars/1',
  name: 'bar',
};

const store = {
  getItem(iri) {
    return getItemByIri([foo, bar], iri);
  },
};

it('should work with a single item', async () => {
  let filter = new ItemFilter(undefined, {store});
  await filter.denormalize('/api/foos/1');
  expect(filter.item).toBe(foo);
  expect(filter.normalize()).toBe('/api/foos/1');

  await filter.denormalize('/api/foos/2');
  expect(filter.item).toBe(null);
  expect(filter.normalize()).toBe(null);

  filter = new ItemFilter('/api/foos/3', {store});
  expect(filter.normalize()).toBe('/api/foos/3');
});

it('should work with several items', async () => {
  const filter = new ItemFilter(undefined, {store});
  await filter.denormalize(['/api/foos/1', '/api/bars/1']);
  expect(filter.items).toEqual([foo, bar]);
  expect(filter.normalize()).toEqual(['/api/foos/1', '/api/bars/1']);

  await filter.denormalize(['/api/foos/1', '/api/foos/2']);
  expect(filter.items).toEqual([foo, null]);
  expect(filter.normalize()).toEqual(['/api/foos/1', null]);
});
