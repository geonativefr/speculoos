import {
  areSameIris,
  checkValidItem,
  containsIri, getIds,
  getItemByIri,
  getItemIndexByIri, getItemsByType,
} from '../iri-functions.js';

it('yells if an item is not valid', () => {
  expect(() => checkValidItem('foo')).toThrowError('Invalid item');
  expect(() => checkValidItem(42)).toThrowError('Invalid item');
  expect(() => checkValidItem({})).toThrowError('Invalid item');
  expect(() => checkValidItem({'@id': '/foos/42'})).not.toThrowError();
});

it('yells if an item has not the expected type', () => {
  expect(() => checkValidItem({'@id': '/foos/42'}, 'Foo'))
    .toThrowError('Expected item of type "Foo", got "undefined".');
  expect(() => checkValidItem({'@id': '/foos/42', '@type': 'Bar'}, 'Foo'))
    .toThrowError('Expected item of type "Foo", got "Bar".');
  expect(() => checkValidItem({'@id': '/foos/42', '@type': 'Bar'}, 'Bar'))
    .not.toThrowError();
  expect(() => checkValidItem({'@id': '/foos/42'}, ['Foo']))
    .toThrowError('Expected item of any "Foo", got "undefined".');
  expect(() => checkValidItem({'@id': '/foos/42', '@type': 'Bar'}, ['Foo']))
    .toThrowError('Expected item of any "Foo", got "Bar".');
  expect(() => checkValidItem({'@id': '/foos/42', '@type': 'Bar'}, ['Foo', 'Bar']))
    .not.toThrowError();
});

it('can compare items similarity', () => {

  const foo = {'@id': '/foo'};
  const bar = {'@id': '/bar'};
  const fooCopy = {'@id': '/foo'};

  expect(areSameIris(foo, foo)).toBe(true);
  expect(areSameIris(foo, bar)).toBe(false);
  expect(areSameIris(foo, fooCopy)).toBe(true);
  expect(areSameIris(foo, foo['@id'])).toBe(true);
  expect(areSameIris(foo, bar['@id'])).toBe(false);
  expect(areSameIris(foo, fooCopy['@id'])).toBe(true);

  expect(areSameIris(foo['@id'], foo)).toBe(true);
  expect(areSameIris(foo['@id'], bar)).toBe(false);
  expect(areSameIris(foo['@id'], fooCopy)).toBe(true);
  expect(areSameIris(foo['@id'], foo['@id'])).toBe(true);
  expect(areSameIris(foo['@id'], bar['@id'])).toBe(false);
  expect(areSameIris(foo['@id'], fooCopy['@id'])).toBe(true);

  expect(areSameIris(bar, foo)).toBe(false);
  expect(areSameIris(fooCopy, foo)).toBe(true);
  expect(areSameIris(foo['@id'], foo)).toBe(true);
  expect(areSameIris(bar['@id'], foo)).toBe(false);
  expect(areSameIris(fooCopy['@id'], foo)).toBe(true);

  expect(areSameIris(foo, foo['@id'])).toBe(true);
  expect(areSameIris(bar, foo['@id'])).toBe(false);
  expect(areSameIris(fooCopy, foo['@id'])).toBe(true);
  expect(areSameIris(bar['@id'], foo['@id'])).toBe(false);
  expect(areSameIris(fooCopy['@id'], foo['@id'])).toBe(true);

});

it('finds an item among others', () => {
  const items = [
    {'@id': '/foos/1'},
    {'@id': '/foos/2'},
  ];
  const iris = items.map(item => item['@id']);

  expect(containsIri(items, '/foos/1')).toBe(true);
  expect(containsIri(items, '/foos/3')).toBe(false);
  expect(containsIri(iris, '/foos/1')).toBe(true);
  expect(containsIri(iris, '/foos/3')).toBe(false);

  expect(containsIri(items, {'@id': '/foos/1'})).toBe(true);
  expect(containsIri(items, {'@id': '/foos/3'})).toBe(false);
  expect(containsIri(iris, {'@id': '/foos/1'})).toBe(true);
  expect(containsIri(iris, {'@id': '/foos/3'})).toBe(false);
});

it('gets an item by its IRI', () => {
  const items = [
    {'@id': '/foos/1'},
    {'@id': '/foos/2'},
  ];

  expect(getItemByIri(items, '/foos/2')).toBe(items[1]);
  expect(getItemByIri(items, '/foos/3')).toBeNull();
  expect(getItemByIri(items, {'@id': '/foos/2'})).toBe(items[1]);
  expect(getItemByIri(items, {'@id': '/foos/3'})).toBeNull();
});

it('gets an item index by its IRI', () => {
  const items = [
    {'@id': '/foos/1'},
    {'@id': '/foos/2'},
  ];

  expect(getItemIndexByIri(items, '/foos/2')).toBe(1);
  expect(getItemIndexByIri(items, '/foos/3')).toBe(-1);
  expect(getItemIndexByIri(items, {'@id': '/foos/2'})).toBe(1);
  expect(getItemIndexByIri(items, {'@id': '/foos/3'})).toBe(-1);
});

it('filters items by type', () => {
  const items = [
    {'@id': '/foos/1', '@type': 'Foo'},
    {'@id': '/bars/1', '@type': 'Bar'},
    {'@id': '/foos/2', '@type': 'Foo'},
    {'@id': '/bars/2', '@type': 'Bar'},
  ];

  expect(getItemsByType(items, 'Foo')).toEqual([items[0], items[2]]);
});

it('extract ids', () => {
  const irisOrItems = [
    '/api/foos/12345',
    {'@id': '/api/foos/67890'},
  ];

  expect(getIds(irisOrItems)).toEqual([
    '12345',
    '67890',
  ]);
});
