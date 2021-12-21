import { ConstraintViolationList, Violation } from '../factories/constraint-violation-list.js';

it('returns violations', () => {
  const input = {
    '@context': '/api/contexts/ConstraintViolationList',
    '@type': 'ConstraintViolationList',
    'hydra:title': 'An error occurred',
    'hydra:description': 'The whole form is messed up.',
    'violations': [
      {
        'propertyPath': 'name',
        'message': 'This value should not be blank.',
        'code': 'c1051bb4-d103-4f74-8988-acbcafc7fdc3',
      },
      {
        'propertyPath': 'password',
        'message': 'This password is too weak',
        'code': '3b3c33d3-d203-4a85-bf2d-925439764060',
      },
      {
        'propertyPath': 'password',
        'message': 'This password has leaked',
        'code': 'b6ca3b25-a7a7-46ad-9f97-6d2a178ad41c',
      },
      {
        'propertyPath': null,
        'message': 'The whole form is messed up',
        'code': '08ca043b-af63-4555-9210-6843caf48156',
      },
      {
        'propertyPath': '',
        'message': 'The whole form is messed up',
        'code': '08ca043b-af63-4555-9210-6843caf48156',
      },
    ],
  };
  const list = new ConstraintViolationList(input);
  expect(list.violations).toHaveLength(5);
  expect(list.getViolations()).toHaveLength(5);

  const violations = Array.from(list);
  expect(violations[0]).toBeInstanceOf(Violation);
  expect(violations[0].propertyPath).toBe('name');
  expect(violations[0].message).toBe('This value should not be blank.');
  expect(violations[0].code).toBe('c1051bb4-d103-4f74-8988-acbcafc7fdc3');
  expect(violations[0].id).toHaveLength(36);
  expect(list.getViolations('name')).toEqual([violations[0]]);
  expect(list.getViolations('password')).toEqual([violations[1], violations[2]]);
  expect(list.getViolations('whatever')).toEqual([]);
  expect(list.getViolations(null)).toEqual([violations[3], violations[4]]);
  expect(list.getViolations('')).toEqual([violations[3], violations[4]]);
});
