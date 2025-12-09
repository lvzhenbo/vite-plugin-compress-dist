import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: './src/main.ts',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [
        'vite',
        '@zip.js/zip.js',
        'consola',
        'filesize',
        'node:fs/promises',
        'node:path',
        'rimraf',
      ],
    },
  },
});
