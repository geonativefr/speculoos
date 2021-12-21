import { TruthyFilter } from '../truthy-filter.js';

it('should work', () => {
  let filter = TruthyFilter.denormalize('yes');
  expect(filter).toBeInstanceOf(TruthyFilter);

  expect(filter.value).toBe(true);
  expect(filter.normalize()).toBe('true');

  filter = TruthyFilter.denormalize(' 1 ');
  expect(filter.value).toBe(true);
  expect(filter.normalize()).toBe('true');

  filter = TruthyFilter.denormalize('0');
  expect(filter.value).toBe(false);
  expect(filter.normalize()).toBe('false');

  filter = TruthyFilter.denormalize('false');
  expect(filter.value).toBe(false);
  expect(filter.normalize()).toBe('false');
});
