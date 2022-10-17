import { TextFilter } from '../text-filter.js';

it('should work', () => {
  const filter = new TextFilter();
  filter.denormalize('foo');

  expect(filter.value).toBe('foo');
  expect(filter.normalize()).toBe('foo');

  filter.denormalize(' foo ');
  expect(filter.value).toBe('foo');
  expect(filter.normalize()).toBe('foo');

  filter.denormalize(' ');
  expect(filter.value).toBe(null);
  expect(filter.normalize()).toBe(null);

  filter.denormalize(' ');
  expect(filter.normalize()).toBe(null);

  filter.denormalize(123);
  expect(filter.normalize()).toBe('123');
});
