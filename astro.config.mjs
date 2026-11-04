import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://niruvibes.github.io',
  base: '/zk-algos-comp3821',
  integrations: [mdx()],
});