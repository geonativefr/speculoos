import { TextFilter } from '../text-filter.js';

it('should work', () => {
  let filter = TextFilter.denormalize('foo');
  expect(filter).toBeInstanceOf(TextFilter);

  expect(filter.value).toBe('foo');
  expect(filter.normalize()).toBe('foo');

  filter = TextFilter.denormalize(' foo ');
  expect(filter.value).toBe('foo');
  expect(filter.normalize()).toBe('foo');

  filter = TextFilter.denormalize(' ');
  expect(filter.value).toBe(null);
  expect(filter.normalize()).toBe(null);

  filter = TextFilter.denormalize(' ');
  expect(filter.normalize()).toBe(null);
});
