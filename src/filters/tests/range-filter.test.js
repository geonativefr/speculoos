import { RangeFilter } from '../range-filter';

it('denormalizes an input object', async () => {
  const combinations = [
    {
      gt: '0',
      lt: '10',
      includeLeftExpectation: false,
      includeRightExpectation: false,
    },
    {
      gte: '0',
      lt: '10',
      includeLeftExpectation: true,
      includeRightExpectation: false,
    },
    {
      gt: '0',
      lte: '10',
      includeLeftExpectation: false,
      includeRightExpectation: true,
    },
    {
      gte: '0',
      lte: '10',
      includeLeftExpectation: true,
      includeRightExpectation: true,
    },
  ];

  for (const combination of combinations) {
    const filter = new RangeFilter();
    await filter.denormalize(combination);
    expect(filter.left).toBe(parseFloat(combination.gt ?? combination.gte));
    expect(filter.right).toBe(parseFloat(combination.lt ?? combination.lte));
    expect(filter.includeLeft).toBe(combination.includeLeftExpectation);
    expect(filter.includeRight).toBe(combination.includeRightExpectation);
  }
});

it('normalizes', () => {
  const combinations = [
    {
      left: 0,
      right: 10,
      includeLeft: false,
      includeRight: false,
      expected: {gt: '0', lt: '10'},
    },
    {
      left: 0,
      right: 10,
      includeLeft: true,
      includeRight: false,
      expected: {gte: '0', lt: '10'},
    },
    {
      left: 0,
      right: 10,
      includeLeft: false,
      includeRight: true,
      expected: {gt: '0', lte: '10'},
    },
    {
      left: 0,
      right: 10,
      includeLeft: true,
      includeRight: true,
      expected: {gte: '0', lte: '10'},
    },
    {
      left: 0,
      expected: {gte: '0'},
    },
    {
      expected: undefined,
    },
  ];

  for (const combination of combinations) {
    const filter = new RangeFilter(combination.left, combination.right, combination.includeLeft, combination.includeRight);
    expect(filter.normalize()).toEqual(combination.expected);
  }
});
