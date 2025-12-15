import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: './src/main.ts',
  },
  dts: true,
  fixedExtension: false,
});
