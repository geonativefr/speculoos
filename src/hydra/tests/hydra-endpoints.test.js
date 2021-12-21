import { HydraEndpoint, HydraEndpoints } from '../hydra-endpoints.js';

const endpoints = new HydraEndpoints({
  Author: '/api/authors',
  Book: '/api/books',
});

it('makes endpoints', () => {
  expect(endpoints).toBeInstanceOf(HydraEndpoints);
  expect(endpoints).toEqual({
    Author: {endpoint: '/api/authors'},
    Book: {endpoint: '/api/books'},
  });
});

it('returns the appropriate endpoint for an item', () => {
  const item = {'@type': 'Book'};
  const endpoint = endpoints.for(item);
  expect(endpoint).toBeInstanceOf(HydraEndpoint);
  expect(`${endpoint}`).toBe('/api/books');
  expect(JSON.stringify(endpoint)).toBe('"/api/books"');
});

it('returns a new instance with a query string', () => {
  const filtered = endpoints.for('Book').withQuery({foo: 'bar'});
  expect(`${filtered}`).toBe('/api/books?foo=bar');
  expect(endpoints.for('Book')).not.toEqual(filtered);
});

it('returns a new paginated instance', () => {
  const filtered = endpoints.for('Book').withQuery({foo: 'bar'});
  expect(`${filtered.paginated()}`)
    .toBe('/api/books?foo=bar&pagination=1');
});

it('returns a new paginated instance with an itemsPerPage param', () => {
  const filtered = endpoints.for('Book').withQuery({foo: 'bar'});
  expect(`${filtered.paginated(12)}`)
    .toBe('/api/books?foo=bar&pagination=1&itemsPerPage=12');
});

it('returns a new instance with disabled pagination', () => {
  const filtered = endpoints.for('Book').withQuery({foo: 'bar'});
  expect(`${filtered.paginated(false)}`)
    .toBe('/api/books?foo=bar&pagination=0');
});

it('returns a new instance with disabled pagination', () => {
  const filtered = endpoints.for('Book').withQuery({foo: 'bar'});
  expect(`${filtered.paginated(false)}`)
    .toBe('/api/books?foo=bar&pagination=0');
});

it('returns a new instance synchronized with the current location', () => {
  delete window.location; // https://remarkablemark.org/blog/2018/11/17/mock-window-location/
  window.location = {href: 'http://localhost/foo?foo=baz&page=2'};
  const filtered = endpoints.for('Book').withQuery({foo: 'bar'}).paginated(12);
  expect(`${filtered.synchronize()}`)
    .toBe('/api/books?foo=baz&pagination=1&itemsPerPage=12&page=2');
});
