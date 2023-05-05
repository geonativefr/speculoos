import { createTestApp, useSetup } from '../../../vue-tests-setup.js';
import { createMercure, useMercure } from '../mercure-plugin.ts';
import { Mercure } from '../index.ts';

it('provides a Mercure service', async () => {
  const app = createTestApp();
  app.use(createMercure('https://example.org/.well-known/mercure'));
  const mercure = await useSetup(app, async () => {
    return useMercure();
  });
  expect(mercure).toBeInstanceOf(Mercure);
});
