// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages config for igniticab.github.io/groundwork.
// To switch to a custom domain (e.g. groundwork.dev) later: drop the `base`,
// set `site` to the custom domain, and add public/CNAME with the domain.
export default defineConfig({
  site: 'https://igniticab.github.io',
  base: '/groundwork',
  trailingSlash: 'ignore',
  build: {
    assets: 'assets',
  },
});
