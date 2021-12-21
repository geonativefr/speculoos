import { Mercure } from './index.js';
import { inject } from 'vue';

export const createMercure = (hub, options) => {
  const mercure = new Mercure(hub, options);

  return Object.assign(mercure, {
    install(app) {
      app.provide('mercure', mercure);
    },
  });
};

export const useMercure = () => {
  return inject('mercure');
};
