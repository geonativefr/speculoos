import { OrderFilter } from '../order-filter.js';

it('should work', () => {
  let filter = OrderFilter.denormalize({foo: 'desc', bar: 'asc'});

  expect(filter).toBeInstanceOf(OrderFilter);
  expect(filter.normalize()).toEqual({foo: 'desc', bar: 'asc'});
});

it('reverts order', () => {
  let filter = OrderFilter.denormalize({foo: 'desc', bar: 'asc'});
  filter.revert();
  expect(filter.normalize()).toEqual({foo: 'asc', bar: 'desc'});
});
