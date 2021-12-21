import { vulcain } from '../index.js';

it('generates Vulcain headers', () => {
  expect(vulcain()).toEqual({});
  expect(vulcain({preload: ['foos/*/@id']})).toEqual({
    preload: '"foos/*/@id"'
  });
  expect(vulcain({fields: ['@id', 'name']})).toEqual({
    fields: '"@id", "name"'
  });
  expect(vulcain({fields: ['@id', 'name'], preload: ['foos/*/@id']})).toEqual({
    preload: '"foos/*/@id"',
    fields: '"@id", "name", "foos/*/@id"'
  });
});
