import { ArrayFilter } from '../array-filter.js';
import { FilterCollection } from '../filter-collection.js';

it('should work', () => {
  let filter = ArrayFilter.denormalize(['foo', 'bar']);
  expect(filter).toBeInstanceOf(ArrayFilter);

  expect(filter.values).toEqual(['foo', 'bar']);
  expect(filter.normalize()).toEqual(['foo', 'bar']);

  filter = ArrayFilter.denormalize(' ');
  expect(filter.values).toEqual([]);
  expect(filter.normalize()).toEqual([]);

  filter = ArrayFilter.denormalize(undefined);
  expect(filter.normalize()).toEqual([]);

  filter = ArrayFilter.denormalize(null);
  expect(filter.normalize()).toEqual([]);

  filter = new ArrayFilter([0, 1]);
  expect(filter.normalize()).toEqual([0, 1]);

  const collection = new FilterCollection({filter});
  expect(collection.normalize()).toEqual({filter: [0, 1]});
});
