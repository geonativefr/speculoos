import { DateRangeFilter } from '../date-range-filter.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
DateRangeFilter.userTimezone = 'Europe/Tallinn';

it('denormalizes an input object', () => {
  const filter = new DateRangeFilter();
  filter.denormalize({
    after: '2021-06-15T21:00:00Z',
    before: '2021-06-17T20:59:59Z',
  });
  expect(filter.after).toBe('2021-06-16');
  expect(filter.before).toBe('2021-06-17');
});

it('denormalizes an input object without using user timezone', () => {
  const filter = new DateRangeFilter({}, {withTime: true, useUserTimezone: false});
  filter.denormalize({
    after: '2021-06-15T21:00:00Z',
    before: '2021-06-17T20:59:59Z',
  });
  expect(filter.after).toBe('2021-06-15');
  expect(filter.before).toBe('2021-06-17');
});

it('partially denormalizes an input object', () => {
  const filter = new DateRangeFilter();
  filter.denormalize({
    before: '2021-06-17T20:59:59Z',
  });
  expect(filter.after).toBeNull();
  expect(filter.before).toBe('2021-06-17');

  filter.denormalize({
    after: '2021-06-15T21:00:00Z',
  });
  expect(filter.after).toBe('2021-06-16');
  expect(filter.before).toBeNull();
});

it('normalizes the filter', () => {
  const filter = new DateRangeFilter({after: '2021-06-16', before: '2021-06-18'});
  expect(filter.normalize()).toStrictEqual({
    after: '2021-06-15T21:00:00Z',
    before: '2021-06-18T20:59:59Z',
  });
});

it('normalizes the filter without using user timezone', () => {
  const filter = new DateRangeFilter(
    {after: '2021-06-16', before: '2021-06-18'},
    {withTime: true, useUserTimezone: false}
  );
  expect(filter.normalize()).toStrictEqual({
    after: '2021-06-16T00:00:00Z',
    before: '2021-06-18T23:59:59Z',
  });
});

it('normalizes the filter without using user timezone and without time', () => {
  const filter = new DateRangeFilter(
    {after: '2021-06-16', before: '2021-06-18'},
    {withTime: false, useUserTimezone: false}
  );
  expect(filter.normalize()).toStrictEqual({
    after: '2021-06-16',
    before: '2021-06-18',
  });
});

it('partially normalizes the filter', () => {
  let filter = new DateRangeFilter({before: '2021-06-18'});
  expect(filter.normalize()).toStrictEqual({
    after: null,
    before: '2021-06-18T20:59:59Z',
  }); filter = new DateRangeFilter({after: '2021-06-16'});
  expect(filter.normalize()).toStrictEqual({
    after: '2021-06-15T21:00:00Z',
    before: null,
  });
});
