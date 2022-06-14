import { ArrayFilter } from '../array-filter.js';

it('should work', () => {
  let filter = ArrayFilter.denormalize(['foo']);
  expect(filter).toBeInstanceOf(ArrayFilter);

  expect(filter.values).toEqual(['foo']);
  expect(filter.normalize()).toEqual(['foo']);

  filter = ArrayFilter.denormalize(' ');
  expect(filter.values).toEqual([]);
  expect(filter.normalize()).toEqual([]);

  filter = ArrayFilter.denormalize(undefined);
  expect(filter.normalize()).toEqual([]);

  filter = ArrayFilter.denormalize(null);
  expect(filter.normalize()).toEqual([]);
});
