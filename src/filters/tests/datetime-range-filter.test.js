import { DatetimeRangeFilter } from '../datetime-range-filter.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
DatetimeRangeFilter.userTimezone = 'Europe/Tallinn';

it('denormalizes an input object', () => {
  const filter = DatetimeRangeFilter.denormalize({
    after: '2021-06-15T21:00:00Z',
    before: '2021-06-17T20:59:59Z',
  });
  expect(filter).toBeInstanceOf(DatetimeRangeFilter);
  expect(filter.after).toBe('2021-06-16T00:00:00Z');
  expect(filter.before).toBe('2021-06-17T23:59:59Z');
});

it('partially denormalizes an input object', () => {
  let filter = DatetimeRangeFilter.denormalize({
    before: '2021-06-17T20:59:59Z',
  });
  expect(filter).toBeInstanceOf(DatetimeRangeFilter);
  expect(filter.after).toBeNull();
  expect(filter.before).toBe('2021-06-17T23:59:59Z');

  filter = DatetimeRangeFilter.denormalize({
    after: '2021-06-15T21:00:00Z',
  });
  expect(filter).toBeInstanceOf(DatetimeRangeFilter);
  expect(filter.after).toBe('2021-06-16T00:00:00Z');
  expect(filter.before).toBeNull();
});

it('normalizes the filter', () => {
  const filter = new DatetimeRangeFilter({after: '2021-06-16T00:00:00Z', before: '2021-06-18T23:59:59Z'});
  expect(filter.normalize()).toStrictEqual({
    after: '2021-06-15T21:00:00Z',
    before: '2021-06-18T20:59:59Z',
  });
});

it('partially normalizes the filter', () => {
  let filter = new DatetimeRangeFilter({before: '2021-06-18T23:59:59Z'});
  expect(filter.normalize()).toStrictEqual({
    after: null,
    before: '2021-06-18T20:59:59Z',
  }); filter = new DatetimeRangeFilter({after: '2021-06-16T00:00:00Z'});
  expect(filter.normalize()).toStrictEqual({
    after: '2021-06-15T21:00:00Z',
    before: null,
  });
});
