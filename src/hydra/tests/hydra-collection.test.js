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
