// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://levelchinese.app',
  output: 'static',
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
});
