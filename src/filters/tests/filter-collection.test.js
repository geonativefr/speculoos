import { FilterCollection, useFilters } from '../filter-collection.js';
import { TextFilter } from '../text-filter.js';
import { TruthyFilter } from '../truthy-filter.js';
import { DateRangeFilter } from '../date-range-filter.js';
import { ItemFilter } from '../item-filter.js';
import { createTestApp, useSetup } from '../../../vue-tests-setup.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import { reactive, unref } from 'vue';

const mockRoute = reactive({
  name: 'foo',
  query: {},
  params: {},
});

jest.mock('vue-router', () => ({
  useRoute: jest.fn(() => mockRoute),
  useRouter: jest.fn(() => ({
    push: (route) => {
      Object.assign(mockRoute, route);
    },
  })),
  onBeforeRouteUpdate: jest.fn(),
}));

dayjs.extend(utc);
dayjs.extend(timezone);
DateRangeFilter.userTimezone = 'Europe/Paris';

it('should work', async () => {
  let filters = new FilterCollection({
    name: new TextFilter(),
    defaultName: new TextFilter('bar'),
    active: new TruthyFilter(),
    createdAt: new DateRangeFilter(),
    account: new ItemFilter(),
  });

  await filters.denormalize({
    name: 'foo',
    active: 'true',
    createdAt: {
      after: '2022-06-01T22:00:00Z',
      before: '2022-06-02T21:59:59Z',
    }
  });

  expect(filters.name).toBeInstanceOf(TextFilter);
  expect(filters.name.value).toBe('foo');

  expect(filters.defaultName).toBeInstanceOf(TextFilter);
  expect(filters.defaultName.value).toBe('bar');

  expect(filters.active).toBeInstanceOf(TruthyFilter);
  expect(filters.active.value).toBe(true);

  expect(filters.createdAt.after).toBe('2022-06-02');
  expect(filters.createdAt.before).toBe('2022-06-02');

  expect(filters.account).toBeInstanceOf(ItemFilter);
  expect(filters.account.item).toBe(null);

  filters.name.value = null;
  filters.account.item = {'@id': '/api/accounts/1'};

  expect(filters.normalize()).toEqual({
    defaultName: 'bar',
    active: 'true',
    createdAt: {
      after: '2022-06-01T22:00:00Z',
      before: '2022-06-02T21:59:59Z',
    },
    account: '/api/accounts/1',
  });
});

it('binds the current query string to the given filters', async () => {
  mockRoute.query.foo = 'bar';
  mockRoute.query.name = 'Johnson';
  const {initialState, filters, buildQueryParams, submit} = await useSetup(createTestApp(), async () => {
    const initialState = () => new FilterCollection({
      name: new TextFilter(),
      city: new TextFilter('London'),
      country: new TextFilter('UK'),
    });
    const {filters, buildQueryParams, submit} = await useFilters(initialState);
    unref(filters).country.value = 'GB';

    return {initialState, filters, buildQueryParams, submit};
  });

  expect(initialState().name.value).toBe(null);
  expect(initialState().city.value).toBe('London');
  expect(initialState().country.value).toBe('UK');
  expect(unref(filters).name.value).toBe('Johnson');
  expect(unref(filters).city.value).toBe('London');
  expect(unref(filters).country.value).toBe('GB');

  expect(buildQueryParams()).toEqual({
    foo: 'bar',
    name: 'Johnson',
    city: 'London',
    country: 'GB',
  });

  await submit({page: 1});
  expect(mockRoute).toEqual({
    name: 'foo',
    params: {},
    query: {
      foo: 'bar',
      name: 'Johnson',
      city: 'London',
      country: 'GB',
      page: 1,
    },
  });
});
