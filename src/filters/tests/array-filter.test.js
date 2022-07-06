import { ArrayFilter } from '../array-filter.js';
import { FilterCollection } from '../filter-collection.js';

it('should work', () => {
  let filter = new ArrayFilter();

  filter.denormalize(['foo', 'bar']);
  expect(filter.values).toEqual(['foo', 'bar']);
  expect(filter.normalize()).toEqual(['foo', 'bar']);

  filter.denormalize(' ');
  expect(filter.values).toEqual([]);
  expect(filter.normalize()).toEqual([]);

  filter.denormalize(undefined);
  expect(filter.normalize()).toEqual([]);

  filter.denormalize(null);
  expect(filter.normalize()).toEqual([]);

  filter = new ArrayFilter([0, 1]);
  expect(filter.normalize()).toEqual([0, 1]);

  const collection = new FilterCollection({filter});
  expect(collection.normalize()).toEqual({filter: [0, 1]});
});
