import { Mercure, MercureOptions } from './index.ts';
import { App, inject, Plugin } from 'vue';

export const createMercure = (hub: string, options: MercureOptions): Plugin => {
    const mercure = new Mercure(hub, options);

    return Object.assign(mercure, {
        install(app: App) {
            app.provide('mercure', mercure);
        },
    });
};

export const useMercure = () => {
    return inject('mercure');
};
