import { HydraError } from '../factories/hydra-error.js';

it('reads an error sent with the hydra prefix', () => {
  const error = Object.assign(new HydraError(), {
    '@context': '/api/contexts/Error',
    '@type': 'hydra:Error',
    'hydra:title': 'An error occurred',
    'hydra:description': 'Not Found',
  });
  expect(error).toBeInstanceOf(Error);
  expect(error.title).toBe('An error occurred');
  expect(error.description).toBe('Not Found');
});

it('reads an error sent without the hydra prefix', () => {
  const error = Object.assign(new HydraError(), {
    '@context': '/api/contexts/Error',
    '@id': '/api/errors/404',
    '@type': 'Error',
    'title': 'An error occurred',
    'detail': 'Not Found',
    'status': 404,
    'type': '/errors/404',
    'description': 'Not Found',
  });
  expect(error).toBeInstanceOf(HydraError);
  expect(error.title).toBe('An error occurred');
  expect(error.description).toBe('Not Found');
  expect(error['hydra:title']).toBe('An error occurred');
  expect(error['hydra:description']).toBe('Not Found');
});

it('prefers the prefixed key when an error carries both forms', () => {
  const both = {
    'title': 'unprefixed',
    'hydra:title': 'prefixed',
    'description': 'unprefixed',
    'hydra:description': 'prefixed',
  };
  const reversed = Object.fromEntries(Object.entries(both).reverse());
  for (const payload of [both, reversed]) {
    const error = Object.assign(new HydraError(), payload);
    expect(error.title).toBe('prefixed');
    expect(error.description).toBe('prefixed');
  }
});
