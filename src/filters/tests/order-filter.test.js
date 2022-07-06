import { OrderFilter } from '../order-filter.js';

it('should work', () => {
  const filter = new OrderFilter();
  filter.denormalize({foo: 'desc', bar: 'asc'});

  expect(filter.normalize()).toEqual({foo: 'desc', bar: 'asc'});
});

it('reverts order', () => {
  const filter = new OrderFilter();
  filter.denormalize({foo: 'desc', bar: 'asc'});
  filter.revert();
  expect(filter.normalize()).toEqual({foo: 'asc', bar: 'desc'});
});
