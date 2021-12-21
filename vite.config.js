import { defineConfig } from 'vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.js'),
      name: 'Speculoos',
      fileName: (format) => `speculoos.${format}.js`,
    },
    rollupOptions: {
      // createEndpoints sure to externalize deps that shouldn't be bundled
      // into your library
      external: [
        '@vueuse/core',
        'clone-deep',
        'deepmerge',
        'is-empty',
        'md5',
        'mitt',
        'psr7-js',
        'uuid',
        'uri-templates',
        'vue',
        'vue-router',
      ],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
});
