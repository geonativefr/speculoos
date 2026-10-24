import { HydraCollection } from '../factories/hydra-collection.js';

const data = {
  '@context': '/api/contexts/Book',
  '@id': '/api/books',
  '@type': 'hydra:Collection',
  'hydra:member': [
    {
      '@id': '/api/books/01EPSDFMFD8NE3EGC2ASJW1DGQ',
      id: '01EPSDFMFD8NE3EGC2ASJW1DGQ',
      name: 'foo',
      status: 'approved'
    },
    {
      '@id': '/api/books/01EPSDFMFD8NE3EGC2ASJW1DGS',
      id: '01EPSDFMFD8NE3EGC2ASJW1DGS',
      name: 'bar',
      status: 'approved'
    },
    {
      '@id': '/api/books/01EPSDFMFD8NE3EGC2ASJW1DGV',
      id: '01EPSDFMFD8NE3EGC2ASJW1DGV',
      name: 'bar',
      status: 'pending'
    },
  ],
  'hydra:totalItems': 3,
};

const collection = new HydraCollection(data);

it('is iterable', () => {
    const ids = [];
    for (let item of collection) {
      ids.push(item.id);
    }

    expect(ids).toEqual([
      '01EPSDFMFD8NE3EGC2ASJW1DGQ',
      '01EPSDFMFD8NE3EGC2ASJW1DGS',
      '01EPSDFMFD8NE3EGC2ASJW1DGV',
    ]);
  }
);

it('returns the correct number of items', () => {
  // Nominal test
  expect(collection.length).toEqual(3);
  expect(collection.totalItems).toEqual(3);

  // Ensure count is different than actual collection length
  const dummyCollection = new HydraCollection({
    'hydra:member': [],
    'hydra:totalItems': 10,
  });
  expect(dummyCollection.length).toEqual(0);
  expect(dummyCollection.totalItems).toEqual(10);
});

it('allows being traversed by a forEach callback', () => {
  const ids = [];

  collection.forEach(item => ids.push(item.id));

    expect(ids).toEqual([
      '01EPSDFMFD8NE3EGC2ASJW1DGQ',
      '01EPSDFMFD8NE3EGC2ASJW1DGS',
      '01EPSDFMFD8NE3EGC2ASJW1DGV',
    ]);
});

it('can map items', () => {
    expect(collection.map(item => item.id)).toEqual([
      '01EPSDFMFD8NE3EGC2ASJW1DGQ',
      '01EPSDFMFD8NE3EGC2ASJW1DGS',
      '01EPSDFMFD8NE3EGC2ASJW1DGV',
    ]);
});

it('can filter items', () => {
  const filtered = collection.filter(item => 'approved' === item.status);
  expect(filtered.map(item => item.id)).toEqual([
      '01EPSDFMFD8NE3EGC2ASJW1DGQ',
      '01EPSDFMFD8NE3EGC2ASJW1DGS',
    ]);
});

it('can find an item', () => {
  const found = collection.find(item => '01EPSDFMFD8NE3EGC2ASJW1DGS' === item.id);
  expect(found).toBeInstanceOf(Object);
  expect(found.id).toBe('01EPSDFMFD8NE3EGC2ASJW1DGS');
});


it('can find the index of an item', () => {
  const index = collection.findIndex(item => '01EPSDFMFD8NE3EGC2ASJW1DGV' === item.id);
  expect(index).toEqual(2);
});

const unprefixedData = {
  '@context': '/api/contexts/Book',
  '@id': '/api/books',
  '@type': 'Collection',
  'member': data['hydra:member'],
  'totalItems': 3,
  'view': {
    '@id': '/api/books?page=1',
    '@type': 'PartialCollectionView',
    'first': '/api/books?page=1',
    'next': '/api/books?page=2',
  },
  'search': {
    '@type': 'IriTemplate',
    'template': '/api/books{?name}',
    'variableRepresentation': 'BasicRepresentation',
    'mapping': [],
  },
};

it('reads a collection sent without the hydra prefix', () => {
  for (const collection of [new HydraCollection(unprefixedData), Object.assign(new HydraCollection(), unprefixedData)]) {
    expect(Array.from(collection).map(item => item.id)).toEqual([
      '01EPSDFMFD8NE3EGC2ASJW1DGQ',
      '01EPSDFMFD8NE3EGC2ASJW1DGS',
      '01EPSDFMFD8NE3EGC2ASJW1DGV',
    ]);
    expect(collection.items).toBe(unprefixedData.member);
    expect(collection.length).toEqual(3);
    expect(collection.totalItems).toEqual(3);
    expect(collection['hydra:member']).toBe(unprefixedData.member);
    expect(collection['hydra:totalItems']).toEqual(3);
    expect(collection['hydra:view']).toBe(unprefixedData.view);
    expect(collection['hydra:search']).toBe(unprefixedData.search);
    expect(collection.member).toBe(unprefixedData.member);
    expect(collection.view).toBe(unprefixedData.view);
    expect(collection.search).toBe(unprefixedData.search);
  }
});

it('reads the unprefixed keys of a prefixed collection from their prefixed names', () => {
  const view = {'@id': '/api/books?page=1', '@type': 'hydra:PartialCollectionView'};
  const search = {'@type': 'hydra:IriTemplate', 'hydra:template': '/api/books{?name}'};
  const prefixed = new HydraCollection({...data, 'hydra:view': view, 'hydra:search': search});
  expect(prefixed.member).toBe(data['hydra:member']);
  expect(prefixed.view).toBe(view);
  expect(prefixed.search).toBe(search);
  expect(Object.keys(prefixed)).toEqual([...Object.keys(data), 'hydra:view', 'hydra:search']);
});

it('prefers the prefixed key when a collection carries both forms', () => {
  const both = {
    'member': [{id: 'unprefixed'}],
    'hydra:member': [{id: 'prefixed'}],
    'totalItems': 1,
    'hydra:totalItems': 2,
    'view': 'unprefixed',
    'hydra:view': 'prefixed',
    'search': 'unprefixed',
    'hydra:search': 'prefixed',
  };
  const reversed = Object.fromEntries(Object.entries(both).reverse());
  for (const payload of [both, reversed]) {
    const collection = Object.assign(new HydraCollection(), payload);
    expect(collection.items).toEqual([{id: 'prefixed'}]);
    expect(collection.totalItems).toEqual(2);
    expect(collection.view).toEqual('prefixed');
    expect(collection.search).toEqual('prefixed');
  }
});
