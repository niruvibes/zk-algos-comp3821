import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import { satteriKatex } from './plugins/satteri-katex.js';

import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://niruvibes.github.io',
  base: '/zk-algos-comp3821',
  integrations: [mdx()],
  markdown: {
    processor: satteri({
      features: { math: true },
      mdastPlugins: [satteriKatex]
    }),
  },
});