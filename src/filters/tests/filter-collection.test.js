import { FilterCollection, useFilters } from '../filter-collection.js';
import { RangeFilter } from '../range-filter.js';
import { TextFilter } from '../text-filter.js';
import { TruthyFilter } from '../truthy-filter.js';
import { DateRangeFilter } from '../date-range-filter.js';
import { ItemFilter } from '../item-filter.js';
import { createTestApp, useSetup } from '../../../vue-tests-setup.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import { reactive, ref, unref } from 'vue';
import { onBeforeRouteUpdate } from 'vue-router';
import { ArrayFilter } from '../array-filter.js';
import { getItemByIri } from '../../hydra/index.js';

const store = {
  getItem(iri) {
    return getItemByIri([], iri);
  },
};

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
DateRangeFilter.userTimezone = 'Europe/Tallinn';

beforeEach(() => mockRoute.query = {});
it('should work', async () => {
  let filters = new FilterCollection({
    name: new TextFilter(),
    defaultName: new TextFilter('bar'),
    active: new TruthyFilter(),
    createdAt: new DateRangeFilter(),
    account: new ItemFilter(undefined,{store}),
  });

  await filters.denormalize({
    name: 'foo',
    active: 'true',
    createdAt: {
      after: '2022-06-01T21:00:00Z',
      before: '2022-06-02T20:59:59Z',
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
      after: '2022-06-01T21:00:00Z',
      before: '2022-06-02T20:59:59Z',
    },
    account: '/api/accounts/1',
  });
});

it('resets the filters missing from the input to their initial state', async () => {
  const filters = new FilterCollection({
    name: new TextFilter(),
    defaultName: new TextFilter('bar'),
    tags: new ArrayFilter(['foo']),
    price: new RangeFilter(),
  });

  await filters.denormalize({
    name: 'foo',
    defaultName: 'baz',
    tags: ['bar'],
    price: {gte: '10', lte: '20'},
  });
  filters.tags.values.push('baz');
  await filters.denormalize({price: {gte: '15', lte: '20'}});

  expect(filters.name.value).toBe(null);
  expect(filters.defaultName.value).toBe('bar');
  expect(filters.tags.values).toEqual(['foo']);
  expect(filters.normalize()).toEqual({
    defaultName: 'bar',
    tags: ['foo'],
    price: {gte: '15', lte: '20'},
  });

  filters.tags.values.push('qux');
  await filters.denormalize({});
  expect(filters.normalize()).toEqual({
    defaultName: 'bar',
    tags: ['foo'],
  });
});

it('keeps the initial state of a filter changed in place before the first denormalization', async () => {
  const filters = new FilterCollection({
    tags: new ArrayFilter(['foo']),
  });

  filters.tags.values.push('bar');
  await filters.denormalize({});

  expect(filters.tags.values).toEqual(['foo']);
});

it('keeps the store of an item filter when resetting it', async () => {
  const filters = new FilterCollection({
    account: new ItemFilter(undefined, {store}),
  });

  await filters.denormalize({});

  expect(filters.account.store).toBe(store);
});

it('resets the filters missing from the new route', async () => {
  mockRoute.query.name = 'Johnson';
  const {filters} = await useSetup(createTestApp(), async () => {
    const initialState = () => new FilterCollection({
      name: new TextFilter(),
      country: new TextFilter('UK'),
    });
    return useFilters(initialState);
  });
  expect(unref(filters).name.value).toBe('Johnson');
  unref(filters).country.value = 'GB';

  const onRouteUpdate = onBeforeRouteUpdate.mock.calls.at(-1)[0];
  await onRouteUpdate({query: {}});

  expect(unref(filters).name.value).toBe(null);
  expect(unref(filters).country.value).toBe('UK');
});

it('resets the filters missing from the new route to the current initial state', async () => {
  const hiddenDays = ref(['sat', 'sun']);
  const {filters} = await useSetup(createTestApp(), async () => {
    const initialState = () => new FilterCollection({
      hiddenDays: new ArrayFilter([...hiddenDays.value]),
    });
    return useFilters(initialState);
  });
  expect(unref(filters).hiddenDays.values).toEqual(['sat', 'sun']);

  hiddenDays.value = [];
  unref(filters).hiddenDays.values = [];
  const onRouteUpdate = onBeforeRouteUpdate.mock.calls.at(-1)[0];
  await onRouteUpdate({query: unref(filters).normalize()});

  expect(unref(filters).hiddenDays.values).toEqual([]);
});

it('dismisses the current query string by default', async () => {
  mockRoute.query.foo = 'bar';
  const {buildQueryParams} = await useSetup(createTestApp(), async () => {
    const initialState = () => new FilterCollection({
      name: new TextFilter(),
      country: new TextFilter('UK'),
    });
    const {filters, buildQueryParams, submit} = await useFilters(initialState);
    unref(filters).country.value = 'GB';

    return {initialState, filters, buildQueryParams, submit};
  });
  expect(buildQueryParams({page: 1})).toEqual({
    //foo: 'bar', // Initial query string is dismissed
    page: 1,
    country: 'GB',
  });
});

it('updates the query string with the applied filters, preserving original query string', async () => {
  mockRoute.query.foo = 'bar';
  mockRoute.query.name = 'Johnson';
  const {initialState, filters, buildQueryParams, submit} = await useSetup(createTestApp(), async () => {
    const initialState = () => new FilterCollection({
      name: new TextFilter(),
      city: new TextFilter('London'),
      country: new TextFilter('UK'),
      tags: new ArrayFilter(['foo', 'bar']),
    });
    const {filters, buildQueryParams, submit} = await useFilters(initialState, {preserveQuery: true});
    unref(filters).country.value = 'GB';

    return {initialState, filters, buildQueryParams, submit};
  });

  expect(initialState().name.value).toBe(null);
  expect(initialState().city.value).toBe('London');
  expect(initialState().country.value).toBe('UK');
  expect(unref(filters).name.value).toBe('Johnson');
  expect(unref(filters).city.value).toBe('London');
  expect(unref(filters).country.value).toBe('GB');
  expect(unref(filters).tags.values).toEqual(['foo', 'bar']);

  expect(buildQueryParams()).toEqual({
    foo: 'bar',
    name: 'Johnson',
    city: 'London',
    country: 'GB',
    tags: ['foo', 'bar'],
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
      tags: ['foo', 'bar'],
    },
  });
});

it('can use a different route when submitting', async () => {
  mockRoute.query.foo = 'bar';
  mockRoute.query.name = 'Johnson';
  const {initialState, filters, buildQueryParams, submit} = await useSetup(createTestApp(), async () => {
    const initialState = () => new FilterCollection({
      name: new TextFilter(),
      city: new TextFilter('London'),
      country: new TextFilter('UK'),
      tags: new ArrayFilter([]),
      price: new RangeFilter(9.99, 19.99),
    });
    const {filters, buildQueryParams, submit} = await useFilters(initialState, {
      preserveQuery: true,
      targetRoute: {name: 'target', params: {foo: 'bar'}},
    });
    unref(filters).country.value = 'GB';

    return {initialState, filters, buildQueryParams, submit};
  });

  expect(initialState().name.value).toBe(null);
  expect(initialState().city.value).toBe('London');
  expect(initialState().country.value).toBe('UK');
  expect(unref(filters).name.value).toBe('Johnson');
  expect(unref(filters).city.value).toBe('London');
  expect(unref(filters).country.value).toBe('GB');
  expect(unref(filters).price.left).toBe(9.99);
  expect(unref(filters).price.right).toBe(19.99);

  expect(buildQueryParams()).toEqual({
    foo: 'bar',
    name: 'Johnson',
    city: 'London',
    country: 'GB',
    price: {
      gte: '9.99',
      lte: '19.99',
    },
  });

  await submit({page: 1});
  expect(mockRoute).toEqual({
    name: 'target',
    params: {foo: 'bar'},
    query: {
      foo: 'bar',
      name: 'Johnson',
      city: 'London',
      country: 'GB',
      price: {
        gte: '9.99',
        lte: '19.99',
      },
      page: 1,
    },
  });
});
