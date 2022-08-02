import { TruthyFilter } from '../truthy-filter.js';

it('should work', () => {
  const filter = new TruthyFilter();
  expect(filter.value).toBe(null);
  expect(filter.normalize()).toBe(null);

  filter.denormalize('yes');
  expect(filter.value).toBe(true);
  expect(filter.normalize()).toBe('true');

  filter.denormalize(' 1 ');
  expect(filter.value).toBe(true);
  expect(filter.normalize()).toBe('true');

  filter.denormalize('0');
  expect(filter.value).toBe(false);
  expect(filter.normalize()).toBe('false');

  filter.denormalize('false');
  expect(filter.value).toBe(false);
  expect(filter.normalize()).toBe('false');

  filter.denormalize(1);
  expect(filter.value).toBe(true);
  expect(filter.normalize()).toBe('true');

  filter.denormalize(0);
  expect(filter.value).toBe(false);
  expect(filter.normalize()).toBe('false');

  filter.denormalize(false);
  expect(filter.value).toBe(false);
  expect(filter.normalize()).toBe('false');

  filter.denormalize(true);
  expect(filter.value).toBe(true);
  expect(filter.normalize()).toBe('true');

  filter.denormalize(null);
  expect(filter.value).toBe(null);
  expect(filter.normalize()).toBe(null);

  filter.denormalize(undefined);
  expect(filter.value).toBe(null);
  expect(filter.normalize()).toBe(null);
});
