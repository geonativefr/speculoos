import { defineConfig } from 'vite';
import path from 'path';
import { API_PORT, APP_PORT } from '../ports.js';

/*
 * The application imports speculoos from the committed build, as the applications that install it do.
 * SPECULOOS_BUILD points it to another build of speculoos.es.js, for instance one of an older version.
 */
const speculoos = process.env.SPECULOOS_BUILD
  ? path.resolve(process.env.SPECULOOS_BUILD)
  : path.resolve(__dirname, '../../dist/speculoos.es.js');

export default defineConfig({
  root: __dirname,
  resolve: {
    alias: [
      {find: /^speculoos$/, replacement: speculoos},
      // The components have string templates, compiled in the browser
      {find: /^vue$/, replacement: 'vue/dist/vue.esm-bundler.js'},
    ],
  },
  define: {
    'import.meta.env.API_URL': JSON.stringify(`http://127.0.0.1:${API_PORT}`),
    __VUE_OPTIONS_API__: 'true',
    __VUE_PROD_DEVTOOLS__: 'false',
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
  },
  build: {
    outDir: path.resolve(__dirname, '../.output/app'),
    emptyOutDir: true,
  },
  preview: {
    host: '127.0.0.1',
    port: APP_PORT,
    strictPort: true,
  },
});
